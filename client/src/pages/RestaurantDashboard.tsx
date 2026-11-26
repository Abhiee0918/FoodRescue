import React, { useState } from 'react';
import {
  Utensils,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  Eye,
  Truck,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Trash2,
  X
} from 'lucide-react';
import { Donation, User } from '../types';
import { api } from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { DeliveryTrackingTimeline, getStatusLabel, getStatusBadgeColor } from '../components/DeliveryTrackingTimeline';
import { DeliveryTrackingModal } from '../components/DeliveryTrackingModal';

interface RestaurantDashboardProps {
  user: User;
  donations: Donation[];
  onOpenDonate: () => void;
  onOpenTracking: (donationId: string) => void;
  onDonationDeleted?: (id: string) => void;
}

export const RestaurantDashboard: React.FC<RestaurantDashboardProps> = ({
  user,
  donations,
  onOpenDonate,
  onOpenTracking,
  onDonationDeleted
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'analytics'>('active');
  const [trackingModalDonation, setTrackingModalDonation] = useState<Donation | null>(null);
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);
  const [deleteModalDonation, setDeleteModalDonation] = useState<Donation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePost = async () => {
    if (!deleteModalDonation) return;
    try {
      setIsDeleting(true);
      await api.deleteDonation(deleteModalDonation.id);
      if (onDonationDeleted) {
        onDonationDeleted(deleteModalDonation.id);
      }
      setDeleteModalDonation(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete donation post.');
    } finally {
      setIsDeleting(false);
    }
  };

  const myDonations = donations.filter(d => d.donorId === user.id || !d.donorId); // filtered to own donations
  const activeDonations = myDonations.filter(d => !['completed', 'cancelled'].includes(d.status));
  const completedDonations = myDonations.filter(d => d.status === 'completed');

  const totalMeals = myDonations.reduce((acc, d) => acc + (Number(d.mealCount) || 0), 0);
  const totalKg = myDonations.reduce((acc, d) => acc + (parseFloat(d.quantity) || 15), 0);
  const co2eSaved = Math.round(totalKg * 2.5);

  // Monthly Chart data
  const chartData = [
    { month: 'Jun', meals: 180, kg: 60 },
    { month: 'Jul', meals: 240, kg: 85 },
    { month: 'Aug', meals: 310, kg: 110 },
    { month: 'Sep', meals: 420, kg: 145 },
    { month: 'Oct', meals: totalMeals || 490, kg: totalKg || 170 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-emerald/40 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-emerald/20 text-brand-mint text-xs font-bold uppercase tracking-wider mb-2">
            <span>👨‍🍳 Food Donor Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {user.organizationName || 'Green Leaf Bistro & Catering'}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            {user.address} • Verified Kitchen • HACCP Compliant
          </p>
        </div>

        <button
          onClick={onOpenDonate}
          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-emerald-500 hover:to-brand-emerald text-white text-xs font-bold shadow-xl shadow-brand-emerald/25 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Surplus Batch</span>
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Total Donations</span>
          <span className="text-3xl font-black text-white">{myDonations.length}</span>
          <span className="text-[11px] text-brand-mint block mt-2">Active + Completed batches</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Meals Rescued</span>
          <span className="text-3xl font-black text-brand-mint">{totalMeals.toLocaleString()}</span>
          <span className="text-[11px] text-slate-400 block mt-2">Nutritious portions distributed</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Waste Diverted</span>
          <span className="text-3xl font-black text-brand-limeSoft">{totalKg.toFixed(0)} kg</span>
          <span className="text-[11px] text-slate-400 block mt-2">Landfill diversion certified</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-brand-emerald text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Active Listings ({activeDonations.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-brand-emerald text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Donation History ({completedDonations.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-brand-emerald text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Impact Trends
        </button>
      </div>

      {/* TAB 1: ACTIVE DONATIONS */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeDonations.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl text-center text-slate-400 text-xs">
              <Utensils className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p>No active surplus listings right now.</p>
              <button
                onClick={onOpenDonate}
                className="mt-4 px-4 py-2 rounded-xl bg-brand-emerald text-white font-bold cursor-pointer inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Post Surplus Food</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeDonations.map((don) => (
                <div
                  key={don.id}
                  className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4 relative group hover:border-brand-emerald/40 transition-all"
                >
                  <div>
                    {/* Top Status & Score */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getStatusBadgeColor(don)}`}>
                        {getStatusLabel(don)}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-limeSoft">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Rescue Score: {don.rescueScore}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1">{don.foodName}</h3>
                    <p className="text-xs text-slate-400 mb-3">{don.category} • {don.dietType}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-xl mb-4">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Portions</span>
                        <span className="font-bold text-white">{don.mealCount} meals ({don.quantity})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Pickup Deadline</span>
                        <span className="font-bold text-brand-mint">{don.pickupDeadline}</span>
                      </div>
                    </div>

                    {/* NGO or Volunteer Status Note */}
                    {don.acceptedBy && (
                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs mb-3">
                        <span className="text-brand-mint font-bold block">Accepted by: {don.acceptedBy.ngoName}</span>
                        {don.volunteerId ? (
                          <span className="text-slate-300 text-[11px]">
                            Courier: {don.volunteerId.name} ({don.volunteerId.vehicle})
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Volunteer courier dispatching...</span>
                        )}
                      </div>
                    )}

                    {/* Inline Expandable Flipkart Tracking Timeline */}
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => setExpandedTimelineId(expandedTimelineId === don.id ? null : don.id)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 font-semibold flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="inline-flex items-center gap-1.5 text-brand-mint">
                          <Truck className="w-3.5 h-3.5" />
                          <span>Delivery Tracking Stepper</span>
                        </span>
                        {expandedTimelineId === don.id ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>

                      {expandedTimelineId === don.id && (
                        <div className="mt-3 p-3 rounded-2xl bg-black/40 border border-slate-800 animate-in fade-in">
                          <DeliveryTrackingTimeline donation={don} compact={true} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => setTrackingModalDonation(don)}
                      className="flex-1 min-w-[130px] py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-brand-emerald/20"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Delivery</span>
                    </button>

                    {don.volunteerId && (
                      <button
                        onClick={() => onOpenTracking(don.id)}
                        className="py-2.5 px-3 rounded-xl glass-panel hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Live GPS Telemetry Map"
                      >
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                        <span>GPS Map</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeleteModalDonation(don)}
                      className="py-2.5 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      title="Delete Donation Post"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DONATION HISTORY */}
      {activeTab === 'history' && (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Food Item</th>
                  <th className="p-4">Volume</th>
                  <th className="p-4">Recipient Charity</th>
                  <th className="p-4">Live Tracking Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {myDonations.map((don) => (
                  <tr key={don.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 whitespace-nowrap font-mono text-[11px]">
                      {new Date(don.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-bold text-white">
                      {don.foodName}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {don.mealCount} meals ({don.quantity})
                    </td>
                    <td className="p-4">
                      {don.acceptedBy?.ngoName || 'Open Distribution'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize border ${getStatusBadgeColor(don)}`}>
                        {getStatusLabel(don)}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setTrackingModalDonation(don)}
                        className="px-3 py-1.5 rounded-lg glass-panel hover:bg-brand-emerald/20 text-brand-mint text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track</span>
                      </button>
                      <button
                        onClick={() => setDeleteModalDonation(don)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="Delete Post"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: IMPACT ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Monthly Surplus Diversion Velocity</h3>
              <p className="text-xs text-slate-400">Total meals rescued by Green Leaf Bistro over the past 5 months</p>
            </div>
            <div className="text-xs font-bold text-brand-mint">
              Total 1,640+ Meals
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f241a', borderColor: '#10b981', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="meals" fill="#10b981" radius={[6, 6, 0, 0]} name="Meals Rescued" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Flipkart-Style Delivery Tracking Modal */}
      <DeliveryTrackingModal
        isOpen={Boolean(trackingModalDonation)}
        onClose={() => setTrackingModalDonation(null)}
        donation={trackingModalDonation}
        onOpenLiveMap={onOpenTracking}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalDonation && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-4 flex items-center justify-center animate-in fade-in"
          onClick={() => !isDeleting && setDeleteModalDonation(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md glass-panel p-6 sm:p-7 rounded-3xl border border-rose-500/50 shadow-2xl bg-[#07150f]/95 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <Trash2 className="w-5 h-5" />
                <span>Delete Donation Post</span>
              </div>
              <button
                disabled={isDeleting}
                onClick={() => setDeleteModalDonation(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-200 text-sm font-semibold">
                Are you sure you want to delete this donation post?
              </p>
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="font-bold text-white text-sm">{deleteModalDonation.foodName}</div>
                <div className="text-slate-400">Post ID: <strong className="font-mono text-brand-mint">#{deleteModalDonation.id}</strong></div>
                <div className="text-slate-400">Quantity: <strong className="text-slate-200">{deleteModalDonation.quantity} ({deleteModalDonation.mealCount} meals)</strong></div>
                <div className="text-slate-400">Status: <strong className="text-slate-200 capitalize">{deleteModalDonation.status.replace(/_/g, ' ')}</strong></div>
              </div>
              <p className="text-rose-300/80 text-[11px] leading-relaxed">
                This action will permanently remove the donation post from the database. It will immediately disappear from the Restaurant Portal and NGO Portal listings.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalDonation(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeletePost}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50 shadow-lg shadow-rose-900/30 flex items-center gap-1.5 transition-colors"
              >
                {isDeleting && <Clock className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Post'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
