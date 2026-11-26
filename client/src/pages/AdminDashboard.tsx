import React, { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Check,
  Building,
  Utensils,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Flame,
  Award,
  HeartHandshake,
  Bike,
  Truck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  XCircle,
  X,
  ExternalLink,
  Clock,
  Sparkles,
  Camera,
  PackageCheck,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { User, Donation } from '../types';
import { api } from '../services/api';
import { DeliveryTrackingModal } from '../components/DeliveryTrackingModal';
import { DeliveryTrackingTimeline, getStatusLabel, getStatusBadgeColor } from '../components/DeliveryTrackingTimeline';

interface AdminDashboardProps {
  donations?: Donation[];
  onOpenTracking?: (donationId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  donations: propDonations,
  onOpenTracking
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [localDonations, setLocalDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [activeTab, setActiveTab] = useState<'restaurants' | 'ngos' | 'volunteers' | 'all' | 'deliveries'>('restaurants');
  const [selectedEntity, setSelectedEntity] = useState<User | null>(null);

  // Delivery Monitoring State
  const [deliverySubFilter, setDeliverySubFilter] = useState<'all' | 'in_transit' | 'awaiting_ngo' | 'disputed' | 'completed'>('all');
  const [selectedDisputeDonation, setSelectedDisputeDonation] = useState<Donation | null>(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [resolutionOutcome, setResolutionOutcome] = useState<'verified_completed' | 'cancelled'>('verified_completed');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  const allDonations = propDonations && propDonations.length > 0 ? propDonations : localDonations;

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, usersRes, donRes] = await Promise.all([
        api.getAdminOverview().catch(() => null),
        api.getAdminUsers().catch(() => ({ users: [] })),
        api.getDonations().catch(() => ({ donations: [] }))
      ]);

      if (overviewRes) {
        setMetrics(overviewRes.metrics);
      }
      if (usersRes) {
        setUsers(usersRes.users || []);
      }
      if (donRes?.donations) {
        setLocalDonations(donRes.donations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleVerify = async (id: string) => {
    try {
      const res = await api.toggleUserVerification(id);
      setUsers(prev => prev.map(u => u.id === id ? res.user : u));
      if (selectedEntity?.id === id) {
        setSelectedEntity(res.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSuspend = async (id: string) => {
    try {
      const res = await api.toggleUserSuspension(id);
      setUsers(prev => prev.map(u => u.id === id ? res.user : u));
      if (selectedEntity?.id === id) {
        setSelectedEntity(res.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Grouped users
  const restaurants = users.filter(u => u.role === 'restaurant');
  const ngos = users.filter(u => u.role === 'ngo');
  const volunteers = users.filter(u => u.role === 'volunteer');

  // Filter helper
  const filterList = (list: User[]) => {
    return list.filter(u => {
      // Status filter
      if (statusFilter === 'verified' && !u.verified) return false;
      if (statusFilter === 'pending' && u.verified) return false;

      // Text search
      if (!userSearch) return true;
      const q = userSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.organizationName && u.organizationName.toLowerCase().includes(q)) ||
        (u.phone && u.phone.toLowerCase().includes(q)) ||
        (u.address && u.address.toLowerCase().includes(q)) ||
        (u.serviceArea && u.serviceArea.toLowerCase().includes(q)) ||
        (u.vehicleType && u.vehicleType.toLowerCase().includes(q))
      );
    });
  };

  const filteredRestaurants = filterList(restaurants);
  const filteredNGOs = filterList(ngos);
  const filteredVolunteers = filterList(volunteers);
  const filteredAll = filterList(users);

  // Delivery monitoring computed lists & counts
  const pendingNgoCount = allDonations.filter(
    (d: Donation) => d.status === 'delivered_awaiting_ngo_confirmation' || d.deliveryStatus === 'delivered_awaiting_ngo_confirmation'
  ).length;

  const disputedCount = allDonations.filter(
    (d: Donation) => d.status === 'delivery_disputed' || d.deliveryStatus === 'delivery_disputed'
  ).length;

  const filteredDeliveries = allDonations.filter((d: Donation) => {
    if (deliverySubFilter === 'in_transit') {
      return ['ngo_accepted', 'volunteer_assigned', 'picked_up', 'out_for_delivery'].includes(d.deliveryStatus || d.status);
    }
    if (deliverySubFilter === 'awaiting_ngo') {
      return d.status === 'delivered_awaiting_ngo_confirmation' || d.deliveryStatus === 'delivered_awaiting_ngo_confirmation';
    }
    if (deliverySubFilter === 'disputed') {
      return d.status === 'delivery_disputed' || d.deliveryStatus === 'delivery_disputed';
    }
    if (deliverySubFilter === 'completed') {
      return d.status === 'completed' || d.deliveryStatus === 'delivery_confirmed';
    }
    return true; // 'all'
  });

  const handleAdminVerify = async (donationId: string) => {
    if (!window.confirm('Are you sure you want to manually verify and complete this delivery?')) return;
    try {
      const res = await api.adminVerifyDelivery(donationId);
      setLocalDonations(prev => prev.map(d => d.id === donationId ? res.donation : d));
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDisputeDonation) return;
    try {
      setSubmittingDispute(true);
      const res = await api.resolveDispute(selectedDisputeDonation.id, {
        resolution: resolutionOutcome,
        notes: resolutionNotes
      });
      setLocalDonations(prev => prev.map(d => d.id === selectedDisputeDonation.id ? res.donation : d));
      setSelectedDisputeDonation(null);
      setDisputeModalOpen(false);
      setResolutionNotes('');
    } catch (err: any) {
      alert(err.message || 'Dispute resolution failed');
    } finally {
      setSubmittingDispute(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-emerald/40 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-emerald/20 text-brand-mint text-xs font-bold uppercase tracking-wider mb-2">
            <span>🛡️ Operations & Safety Control HQ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            System Administration & Governance
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time compliance monitoring, separated entity registers, and safety audit flags.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2.5 rounded-xl glass-panel text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-mint' : ''}`} />
          <span>Refresh System Audit</span>
        </button>
      </div>

      {/* KPI Bar - Clickable shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'glass-panel border-brand-emerald bg-brand-emerald/10'
              : 'glass-panel border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-slate-400 block font-semibold">Total Accounts</span>
          <span className="text-2xl font-black text-white">{users.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('restaurants')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'restaurants'
              ? 'glass-panel border-brand-emerald bg-brand-emerald/10 shadow-lg shadow-brand-emerald/10'
              : 'glass-panel border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-slate-400 block font-semibold flex items-center gap-1">
            <Utensils className="w-3 h-3 text-brand-mint" />
            <span>Restaurants</span>
          </span>
          <span className="text-2xl font-black text-brand-mint">{restaurants.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('ngos')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'ngos'
              ? 'glass-panel border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10'
              : 'glass-panel border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-slate-400 block font-semibold flex items-center gap-1">
            <HeartHandshake className="w-3 h-3 text-sky-400" />
            <span>NGO Charities</span>
          </span>
          <span className="text-2xl font-black text-sky-400">{ngos.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('volunteers')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'volunteers'
              ? 'glass-panel border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
              : 'glass-panel border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-slate-400 block font-semibold flex items-center gap-1">
            <Bike className="w-3 h-3 text-amber-400" />
            <span>Couriers</span>
          </span>
          <span className="text-2xl font-black text-amber-400">{volunteers.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('deliveries')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'deliveries'
              ? 'glass-panel border-brand-emerald bg-brand-emerald/10 shadow-lg shadow-brand-emerald/10'
              : 'glass-panel border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-slate-400 block font-semibold flex items-center gap-1">
            <Truck className="w-3 h-3 text-brand-mint" />
            <span>Deliveries</span>
          </span>
          <span className="text-2xl font-black text-brand-mint">{allDonations.length}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('deliveries');
            setDeliverySubFilter('disputed');
          }}
          className="glass-panel p-4 rounded-2xl border-slate-800 hover:border-rose-800 text-left cursor-pointer transition-colors"
        >
          <span className="text-[11px] text-slate-400 block font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Disputes</span>
          </span>
          <span className="text-2xl font-black text-rose-400">
            {allDonations.filter(d => d.status === 'delivery_disputed').length}
          </span>
        </button>
      </div>

      {/* Role Navigation Tabs - Dedicated Registers */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('deliveries')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'deliveries'
                ? 'bg-brand-emerald text-white shadow-lg shadow-brand-emerald/20'
                : 'text-slate-400 hover:text-white glass-panel hover:bg-slate-800'
            }`}
          >
            <Truck className="w-4 h-4 text-brand-mint" />
            <span>Delivery Monitoring ({allDonations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('restaurants')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'restaurants'
                ? 'bg-brand-emerald text-white shadow-lg shadow-brand-emerald/20'
                : 'text-slate-400 hover:text-white glass-panel hover:bg-slate-800'
            }`}
          >
            <Utensils className="w-4 h-4 text-brand-mint" />
            <span>Restaurants & Donors ({restaurants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ngos')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'ngos'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                : 'text-slate-400 hover:text-white glass-panel hover:bg-slate-800'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-sky-400" />
            <span>NGOs & Charities ({ngos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('volunteers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'volunteers'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                : 'text-slate-400 hover:text-white glass-panel hover:bg-slate-800'
            }`}
          >
            <Bike className="w-4 h-4 text-amber-300" />
            <span>Volunteers & Couriers ({volunteers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-slate-400 hover:text-white glass-panel hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-purple-300" />
            <span>All Accounts ({users.length})</span>
          </button>
        </div>

        {/* Global Search & Verification Filter (Visible on all entity tabs) */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder={
                activeTab === 'restaurants' ? 'Search restaurants, chef, address...' :
                activeTab === 'ngos' ? 'Search charities, coverage, capacity...' :
                activeTab === 'volunteers' ? 'Search volunteers, vehicles, phone...' :
                'Search any account...'
              }
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${statusFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('verified')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${statusFilter === 'verified' ? 'bg-emerald-950/80 text-brand-mint font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Verified
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${statusFilter === 'pending' ? 'bg-amber-950/80 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Pending
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. RESTAURANTS & FOOD DONORS REGISTER                    */}
      {/* ======================================================== */}
      {activeTab === 'restaurants' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Registered Commercial Donors & Banquet Kitchens ({filteredRestaurants.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {restaurants.filter(r => r.verified).length} verified • {restaurants.filter(r => !r.verified).length} awaiting review
            </span>
          </div>

          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Restaurant / Commercial Kitchen</th>
                  <th className="p-4">Primary Contact</th>
                  <th className="p-4">Kitchen Address & GPS</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredRestaurants.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 flex items-center justify-center text-brand-mint shrink-0">
                          <Utensils className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {u.organizationName || u.name}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {u.bio || 'Commercial kitchen donor'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{u.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{u.email}</span>
                      </div>
                      {u.phone && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="text-slate-300 flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-brand-mint shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{u.address || 'Address on file'}</span>
                      </div>
                      {u.lat && u.lng && (
                        <span className="inline-block mt-1 font-mono text-[10px] text-slate-500">
                          {u.lat.toFixed(4)}, {u.lng.toFixed(4)}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      {u.verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-brand-mint border border-brand-emerald/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified Donor</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending Review</span>
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedEntity(u)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="View Full Profile Details"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. NGOS & CHARITIES REGISTER                             */}
      {/* ======================================================== */}
      {activeTab === 'ngos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Registered NGO Charities & Community Shelters ({filteredNGOs.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Combined Capacity: {ngos.reduce((acc, n) => acc + (n.capacity || 0), 0)} daily meals
            </span>
          </div>

          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">NGO / Charity Organization</th>
                  <th className="p-4">Service Area Coverage</th>
                  <th className="p-4">Capacity & Urgency</th>
                  <th className="p-4">Accepted Food Types</th>
                  <th className="p-4">Contact Person</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredNGOs.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                          <HeartHandshake className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {u.organizationName || u.name}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {u.bio || 'Community food assistance'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-slate-200 font-medium">
                        {u.serviceArea || 'Metro Service Zone'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {u.address}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-white">
                        {u.capacity ? `${u.capacity} meals/day` : '150 meals/day'}
                      </div>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        u.currentNeed === 'High' ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30' :
                        u.currentNeed === 'Medium' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' :
                        'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {u.currentNeed || 'Active Need'}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {u.dietPreferences && u.dietPreferences.length > 0 ? (
                          u.dietPreferences.map((pref) => (
                            <span key={pref} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                              {pref}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-[11px]">All edible foods</span>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.phone}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">{u.email}</div>
                    </td>

                    <td className="p-4">
                      {u.verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-brand-mint border border-brand-emerald/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified NGO</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending Review</span>
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedEntity(u)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="View Full NGO Profile"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. VOLUNTEERS & COURIERS REGISTER                        */}
      {/* ======================================================== */}
      {activeTab === 'volunteers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Registered Volunteer Couriers & Transportation Fleet ({filteredVolunteers.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Total Completed Trips: {volunteers.reduce((acc, v) => acc + (v.completedTrips || 0), 0)} rescues
            </span>
          </div>

          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Courier Name & Unit</th>
                  <th className="p-4">Vehicle & Equipment</th>
                  <th className="p-4">Rescue Performance</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Availability</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredVolunteers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                          <Bike className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{u.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {u.organizationName || 'Independent Volunteer'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 font-semibold text-[11px]">
                        <Truck className="w-3.5 h-3.5 text-amber-400" />
                        <span>{u.vehicleType || 'Standard Vehicle'}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <div>
                          <span className="text-slate-400">Trips: </span>
                          <strong className="text-white font-bold">{u.completedTrips || 0}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Meals: </span>
                          <strong className="text-brand-mint font-bold">{u.mealsTransported || 0}</strong>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400">Distance: </span>
                          <strong className="text-sky-400 font-mono">{u.totalDistanceKm || 0} km</strong>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-[11px] text-slate-300 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{u.phone || 'Phone on file'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{u.email}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{u.bio ? 'Active Courier' : 'Available'}</span>
                      </span>
                    </td>

                    <td className="p-4">
                      {u.verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-brand-mint border border-brand-emerald/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified Courier</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending Review</span>
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedEntity(u)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="View Courier Details"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. ALL REGISTERED ACCOUNTS (MASTER VIEW)                 */}
      {/* ======================================================== */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Master Accounts Directory ({filteredAll.length})
            </h3>
            <span className="text-xs text-slate-400">All authenticated system entities</span>
          </div>

          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Name / Entity</th>
                  <th className="p-4">Role Classification</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredAll.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.organizationName || u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'restaurant' ? 'bg-emerald-950/80 text-brand-mint border border-brand-emerald/30' :
                        u.role === 'ngo' ? 'bg-sky-950/80 text-sky-300 border border-sky-500/30' :
                        u.role === 'volunteer' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' :
                        'bg-purple-950/80 text-purple-300 border border-purple-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 font-mono text-[11px]">
                      <div>{u.email}</div>
                      {u.phone && <div className="text-slate-500 text-[10px]">{u.phone}</div>}
                    </td>
                    <td className="p-4">
                      {u.verified ? (
                        <span className="inline-flex items-center gap-1 text-brand-mint font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold text-[11px]">Pending Review</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedEntity(u)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. DELIVERY & LOGISTICS MONITORING                       */}
      {/* ======================================================== */}
      {activeTab === 'deliveries' && (
        <div className="space-y-6">
          {/* Sub-filters Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand-mint" />
                Live Delivery & Supply Chain Monitor ({filteredDeliveries.length})
              </h3>
              <p className="text-xs text-slate-400">
                Track full Flipkart-style delivery stages across Restaurant, Volunteer, and NGO portals.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
              {[
                { id: 'all', label: 'All' },
                { id: 'in_transit', label: 'In-Transit' },
                { id: 'awaiting_ngo', label: `Pending NGO (${pendingNgoCount})` },
                { id: 'disputed', label: `Disputed (${disputedCount})` },
                { id: 'completed', label: 'Completed' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setDeliverySubFilter(sub.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    deliverySubFilter === sub.id
                      ? sub.id === 'disputed' && disputedCount > 0
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                        : 'bg-brand-emerald text-white shadow-lg shadow-brand-emerald/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deliveries Grid / Table */}
          {filteredDeliveries.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl text-center border border-slate-800">
              <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-bold text-base">No deliveries matching filter</p>
              <p className="text-xs text-slate-500 mt-1">Donation deliveries will appear here as they transition through the rescue lifecycle.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDeliveries.map((don) => {
                const isDisputed = don.status === 'delivery_disputed' || don.deliveryStatus === 'delivery_disputed';
                const isAwaitingNgo = don.status === 'delivered_awaiting_ngo_confirmation' || don.deliveryStatus === 'delivered_awaiting_ngo_confirmation';
                const isCompleted = don.status === 'completed';

                return (
                  <div
                    key={don.id}
                    className={`glass-panel p-5 sm:p-6 rounded-3xl border transition-all ${
                      isDisputed
                        ? 'border-rose-500/50 bg-rose-950/10 shadow-lg shadow-rose-950/20'
                        : isAwaitingNgo
                        ? 'border-amber-500/40 bg-amber-950/10'
                        : isCompleted
                        ? 'border-emerald-500/30'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Food & Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-brand-mint font-bold">#{don.id}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-xs text-slate-400 font-medium">
                            Created {new Date(don.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-0.5">{don.foodName}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span>Quantity: <strong className="text-white">{don.quantity} ({don.mealCount} meals)</strong></span>
                          <span>•</span>
                          <span>Category: <strong className="text-slate-200 capitalize">{don.category}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isDisputed && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            Dispute Raised
                          </span>
                        )}
                        {isAwaitingNgo && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            Awaiting NGO Confirmation
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950/80 text-brand-mint border border-emerald-500/40 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Delivered & Confirmed
                          </span>
                        )}
                        {!isDisputed && !isAwaitingNgo && !isCompleted && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-950/80 text-sky-300 border border-sky-500/40 flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5" />
                            {don.status.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Disputed Alert Banner */}
                    {isDisputed && (
                      <div className="mt-4 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-rose-300">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          <span>Dispute Raised by NGO ({don.acceptedBy?.ngoName || 'Assigned NGO'})</span>
                        </div>
                        <p className="text-slate-300 bg-rose-950/60 p-2.5 rounded-xl border border-rose-900/60 font-mono">
                          "{don.disputeReason || 'NGO reported food was not received despite delivery mark.'}"
                        </p>
                        <div className="text-[11px] text-rose-300/80">
                          Admin action required: review delivery proof, check volunteer log, and resolve dispute.
                        </div>
                      </div>
                    )}

                    {/* Entities involved */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
                      {/* Restaurant */}
                      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Donor Restaurant</div>
                        <div className="font-bold text-white">{don.donorName}</div>
                        <div className="text-slate-400 flex items-start gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-brand-mint shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{don.pickupLocation?.address || 'Pickup Address'}</span>
                        </div>
                      </div>

                      {/* Volunteer */}
                      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Assigned Volunteer</div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-amber-400" />
                          <span>{don.assignedVolunteerName || don.volunteerId?.name || 'Unassigned'}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] mt-1">
                          {don.pickupTimestamp ? (
                            <span>Picked up: {new Date(don.pickupTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          ) : (
                            <span className="text-slate-500">Not picked up yet</span>
                          )}
                        </div>
                      </div>

                      {/* NGO */}
                      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Recipient NGO</div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                          <span>{don.acceptedBy?.ngoName || 'Awaiting Acceptance'}</span>
                        </div>
                        <div className="text-slate-400 flex items-start gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-sky-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{don.pickupLocation?.address || 'NGO Center'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Proof & Notes (if available) */}
                    {(don.deliveryProofUrl || don.deliveryNotes) && (
                      <div className="mt-4 p-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Delivery Proof & Notes</div>
                          {don.deliveryNotes && (
                            <p className="text-slate-300 italic">"{don.deliveryNotes}"</p>
                          )}
                          {don.deliveryTimestamp && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              Delivered at: {new Date(don.deliveryTimestamp).toLocaleString()}
                            </div>
                          )}
                        </div>

                        {don.deliveryProofUrl && (
                          <div className="flex items-center gap-2">
                            <img
                              src={don.deliveryProofUrl}
                              alt="Proof"
                              className="w-12 h-12 rounded-xl object-cover border border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setSelectedPhotoUrl(don.deliveryProofUrl!)}
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedPhotoUrl(don.deliveryProofUrl!)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                            >
                              View Photo
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons Row */}
                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {onOpenTracking && (
                          <button
                            type="button"
                            onClick={() => onOpenTracking(don.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-mint text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-brand-emerald/30 transition-colors"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            Track Flipkart Timeline
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Dispute Investigation Button */}
                        {isDisputed && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDisputeDonation(don);
                              setDisputeModalOpen(true);
                            }}
                            className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-900/30 transition-colors"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Investigate & Resolve Dispute
                          </button>
                        )}

                        {/* Manual Verification Button */}
                        {!isCompleted && !isDisputed && (
                          <button
                            type="button"
                            onClick={() => handleAdminVerify(don.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-brand-mint border border-brand-emerald/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Manual Admin Verification
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* DISPUTE RESOLUTION MODAL                                 */}
      {/* ======================================================== */}
      {disputeModalOpen && selectedDisputeDonation && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center"
          onClick={() => setDisputeModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-rose-500/50 shadow-2xl bg-[#07150f]/95 animate-in fade-in zoom-in-95 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <span>Investigate Delivery Dispute</span>
              </div>
              <button
                onClick={() => setDisputeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="font-bold text-white text-sm">{selectedDisputeDonation.foodName}</div>
                <div className="text-slate-400">Donation ID: <strong className="text-brand-mint font-mono">{selectedDisputeDonation.id}</strong></div>
                <div className="text-slate-400">NGO: <strong className="text-white">{selectedDisputeDonation.acceptedBy?.ngoName || 'Recipient NGO'}</strong></div>
                <div className="text-slate-400">Volunteer: <strong className="text-white">{selectedDisputeDonation.assignedVolunteerName || 'Assigned Volunteer'}</strong></div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-900/60 space-y-1">
                <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Dispute Reason Reported:</div>
                <p className="text-rose-200 font-medium">"{selectedDisputeDonation.disputeReason || 'Food not physically received.'}"</p>
              </div>

              {selectedDisputeDonation.deliveryProofUrl && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Volunteer Photo Proof:</div>
                  <img
                    src={selectedDisputeDonation.deliveryProofUrl}
                    alt="Proof"
                    className="w-full max-h-48 object-cover rounded-xl border border-slate-700"
                  />
                </div>
              )}

              {/* Resolution Form */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-white">Resolution Outcome</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResolutionOutcome('verified_completed')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      resolutionOutcome === 'verified_completed'
                        ? 'bg-emerald-950/80 border-emerald-500 text-brand-mint shadow-lg shadow-emerald-950/50'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Confirm Valid Delivery</span>
                    <span className="text-[10px] text-slate-400 font-normal">Mark as Completed</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionOutcome('cancelled')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      resolutionOutcome === 'cancelled'
                        ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-lg shadow-rose-950/50'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Cancel / Non-Delivery</span>
                    <span className="text-[10px] text-slate-400 font-normal">Mark Delivery Cancelled</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-white">Admin Investigation Notes</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter investigation findings, resolution rationale, or next steps..."
                  rows={3}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-emerald"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDisputeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDispute}
                onClick={handleResolveDispute}
                className="px-5 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50 shadow-lg shadow-brand-emerald/20 flex items-center gap-2"
              >
                {submittingDispute && <Clock className="w-3.5 h-3.5 animate-spin" />}
                <span>Apply Resolution</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PHOTO PREVIEW MODAL                                      */}
      {/* ======================================================== */}
      {selectedPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4 flex items-center justify-center cursor-pointer"
          onClick={() => setSelectedPhotoUrl(null)}
        >
          <div
            className="max-w-2xl w-full p-2 glass-panel rounded-3xl border border-slate-700 bg-slate-900/95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-3 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-mint" />
                Delivery Photographic Verification Proof
              </span>
              <button
                onClick={() => setSelectedPhotoUrl(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2">
              <img
                src={selectedPhotoUrl}
                alt="Delivery proof full preview"
                className="w-full max-h-[70vh] object-contain rounded-2xl"
              />
            </div>
          </div>
        </div>
      )}



      {/* ======================================================== */}
      {/* FULL ENTITY DOSSIER MODAL                                */}
      {/* ======================================================== */}
      {selectedEntity && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6"
          onClick={() => setSelectedEntity(null)}
        >
          <div className="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-8">
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl glass-panel p-6 sm:p-8 rounded-3xl border border-brand-emerald/40 shadow-2xl relative my-auto bg-[#07150f]/95 animate-in fade-in zoom-in-95"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedEntity(null)}
                className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Dossier"
              >
                <X className="w-5 h-5" />
              </button>

            {/* Modal Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                selectedEntity.role === 'restaurant' ? 'bg-brand-emerald/20 text-brand-mint border border-brand-emerald/40' :
                selectedEntity.role === 'ngo' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' :
                selectedEntity.role === 'volunteer' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              }`}>
                {selectedEntity.role === 'restaurant' ? <Utensils className="w-7 h-7" /> :
                 selectedEntity.role === 'ngo' ? <HeartHandshake className="w-7 h-7" /> :
                 selectedEntity.role === 'volunteer' ? <Bike className="w-7 h-7" /> :
                 <Building className="w-7 h-7" />}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-white">
                    {selectedEntity.organizationName || selectedEntity.name}
                  </h3>
                  {selectedEntity.verified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-brand-mint border border-brand-emerald/40">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                      <Clock className="w-3 h-3" />
                      Pending Verification
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">{selectedEntity.name}</span>
                  <span>•</span>
                  <span className="uppercase tracking-wider font-bold text-[10px] text-slate-400">
                    Role: {selectedEntity.role}
                  </span>
                  <span>•</span>
                  <span>ID: {selectedEntity.id}</span>
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs">
              {/* Contact Card */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Contact Coordinates
                </span>
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-brand-mint shrink-0" />
                  <span className="font-mono text-xs">{selectedEntity.email}</span>
                </div>
                {selectedEntity.phone && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-4 h-4 text-brand-mint shrink-0" />
                    <span className="font-mono text-xs">{selectedEntity.phone}</span>
                  </div>
                )}
                {selectedEntity.address && (
                  <div className="flex items-start gap-2 text-slate-300">
                    <MapPin className="w-4 h-4 text-brand-mint shrink-0 mt-0.5" />
                    <span>{selectedEntity.address}</span>
                  </div>
                )}
                {selectedEntity.lat && selectedEntity.lng && (
                  <div className="text-[11px] text-slate-500 font-mono pl-6">
                    GPS: {selectedEntity.lat.toFixed(5)}° N, {selectedEntity.lng.toFixed(5)}° E
                  </div>
                )}
              </div>

              {/* Role Specific Attributes */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  {selectedEntity.role === 'restaurant' ? 'Kitchen & Food Specs' :
                   selectedEntity.role === 'ngo' ? 'Distribution Operations' :
                   selectedEntity.role === 'volunteer' ? 'Transport Logistics' : 'Account Details'}
                </span>

                {selectedEntity.role === 'ngo' && (
                  <>
                    <div>
                      <span className="text-slate-400">Service Area: </span>
                      <strong className="text-white">{selectedEntity.serviceArea || 'Metro Area'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Daily Meal Capacity: </span>
                      <strong className="text-brand-mint">{selectedEntity.capacity || 150} meals/day</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Urgency Level: </span>
                      <strong className="text-amber-300">{selectedEntity.currentNeed || 'Active'}</strong>
                    </div>
                  </>
                )}

                {selectedEntity.role === 'volunteer' && (
                  <>
                    <div>
                      <span className="text-slate-400">Transport Fleet: </span>
                      <strong className="text-white">{selectedEntity.vehicleType || 'Standard Vehicle'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Completed Deliveries: </span>
                      <strong className="text-brand-mint">{selectedEntity.completedTrips || 0} missions</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Meals Rescued & Moved: </span>
                      <strong className="text-sky-400">{selectedEntity.mealsTransported || 0} meals</strong>
                    </div>
                  </>
                )}

                {selectedEntity.role === 'restaurant' && (
                  <>
                    <div>
                      <span className="text-slate-400">Entity Type: </span>
                      <strong className="text-white">Commercial Food Donor</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Hygiene & Protocol: </span>
                      <strong className="text-brand-mint">HACCP Cold/Hot Hold Standard</strong>
                    </div>
                  </>
                )}

                <div>
                  <span className="text-slate-400">Member Since: </span>
                  <span className="text-slate-300">
                    {new Date(selectedEntity.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Entity Bio */}
            {selectedEntity.bio && (
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 mb-6 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                  Entity Bio & Mission Statement
                </span>
                <p className="text-slate-300 leading-relaxed">{selectedEntity.bio}</p>
              </div>
            )}

            {/* Close inside Dossier Modal */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {selectedEntity.verified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 text-brand-mint font-semibold text-xs border border-brand-emerald/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 font-semibold text-xs border border-amber-500/30">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending Review</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedEntity(null)}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Close Details</span>
                </button>
              </div>
            </div>

          </div>
          </div>
        </div>
      )}

    </div>
  );
};
