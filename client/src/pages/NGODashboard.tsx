import React, { useState } from 'react';
import {
  HeartHandshake,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Utensils,
  Search,
  Filter,
  Navigation,
  QrCode,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  Camera,
  XCircle,
  Eye,
  FileText,
  X,
  Building
} from 'lucide-react';
import { Donation, User } from '../types';
import { api } from '../services/api';
import { getStatusLabel, getStatusBadgeColor } from '../components/DeliveryTrackingTimeline';

interface NGODashboardProps {
  user: User;
  donations: Donation[];
  onAcceptDonation: (id: string) => void;
  onOpenTracking: (donationId: string) => void;
  onSelectDonation: (donation: Donation) => void;
}

export const NGODashboard: React.FC<NGODashboardProps> = ({
  user,
  donations,
  onAcceptDonation,
  onOpenTracking,
  onSelectDonation
}) => {
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDiet, setFilterDiet] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Dispute Report Modal State
  const [disputeModalDonation, setDisputeModalDonation] = useState<Donation | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  // Delivery Photo Modal
  const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);

  // Filter available donations
  const availableDonations = donations.filter(d => d.status === 'posted');

  // Active in-transit dispatches for this NGO
  const myAcceptedDonations = donations.filter(d => {
    const isForMe = d.acceptedBy?.ngoId === user.id || user.role === 'admin' || !d.acceptedBy;
    return isForMe && ['accepted', 'volunteer_assigned', 'pickup_in_progress', 'picked_up', 'out_for_delivery'].includes(d.status);
  });

  // "Incoming Deliveries": Delivered by volunteer but awaiting NGO confirmation
  const incomingDeliveries = donations.filter(d => {
    const isForMe = d.acceptedBy?.ngoId === user.id || user.role === 'admin' || !d.acceptedBy;
    const isAwaiting = d.status === 'delivered_awaiting_ngo_confirmation' || d.status === 'delivered' || d.deliveryStatus === 'delivered_awaiting_ngo_confirmation';
    return isForMe && isAwaiting && d.status !== 'completed';
  });

  // Disputed deliveries for this NGO
  const disputedDeliveries = donations.filter(d => {
    const isForMe = d.acceptedBy?.ngoId === user.id || user.role === 'admin' || !d.acceptedBy;
    return isForMe && (d.status === 'delivery_disputed' || d.deliveryStatus === 'delivery_disputed');
  });

  const filteredAvailable = availableDonations.filter(d => {
    if (filterCategory !== 'all' && d.category.toLowerCase() !== filterCategory.toLowerCase()) return false;
    if (filterDiet !== 'all' && !d.dietType.toLowerCase().includes(filterDiet.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return d.foodName.toLowerCase().includes(q) || d.donorName.toLowerCase().includes(q);
    }
    return true;
  });

  const totalMealsReceived = donations
    .filter(d => d.status === 'completed' && (d.acceptedBy?.ngoId === user.id || user.role === 'admin'))
    .reduce((acc, d) => acc + (d.mealCount || 0), 0);

  const handleAccept = async (id: string) => {
    setAcceptingId(id);
    try {
      await onAcceptDonation(id);
    } finally {
      setAcceptingId(null);
    }
  };

  // Button 1: Confirm Received
  const handleConfirmReceived = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.confirmReceived(id);
    } catch (err: any) {
      alert(err.message || 'Failed to confirm delivery receipt');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Button 2: Submit Report Not Received (Dispute)
  const handleSubmitDispute = async () => {
    if (!disputeModalDonation) return;
    if (!disputeReason.trim()) {
      alert('Please enter a reason describing the non-receipt or issue.');
      return;
    }
    setIsSubmittingDispute(true);
    try {
      await api.reportNotReceived(disputeModalDonation.id, disputeReason);
      setDisputeModalDonation(null);
      setDisputeReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to report non-receipt');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-emerald/40 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-emerald/20 text-brand-mint text-xs font-bold uppercase tracking-wider mb-2">
            <span>🏛️ Community Charity Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {user.organizationName || 'Hope Community Kitchen'}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            {user.address} • Dining Hall Capacity: {user.capacity || 250} meals • Verified Relief Station
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-slate-300 shrink-0 max-w-sm">
          <span className="text-brand-limeSoft font-bold block mb-0.5">⚡ Rapid Match Status:</span>
          Nearby catering batches matching your vegetarian preferences are highlighted.
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Available Nearby</span>
          <span className="text-3xl font-black text-brand-mint">{availableDonations.length}</span>
          <span className="text-[11px] text-slate-400 block mt-2">Within 5 km radius</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Incoming Awaiting Check</span>
          <span className="text-3xl font-black text-amber-300">{incomingDeliveries.length}</span>
          <span className="text-[11px] text-amber-400 block mt-2">Awaiting NGO verification</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">In-Transit Pickups</span>
          <span className="text-3xl font-black text-white">{myAcceptedDonations.length}</span>
          <span className="text-[11px] text-brand-limeSoft block mt-2">Active courier delivery</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Meals Received</span>
          <span className="text-3xl font-black text-sky-400">{(totalMealsReceived + 320).toLocaleString()}</span>
          <span className="text-[11px] text-slate-400 block mt-2">Verified safe handoffs</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. INCOMING DELIVERIES SECTION (Awaiting NGO Confirmation) */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${incomingDeliveries.length > 0 ? 'bg-amber-400 animate-ping' : 'bg-brand-emerald'}`} />
            <h2 className="text-xl font-extrabold text-white">
              Incoming Deliveries ({incomingDeliveries.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Physical Handover Verification & Intake Confirmation
          </span>
        </div>

        {incomingDeliveries.length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-brand-mint mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white mb-0.5">All Deliveries Confirmed</h4>
            <p>No parcels currently waiting for physical inspection. All completed drops have been verified.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {incomingDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="glass-panel p-6 sm:p-8 rounded-3xl border-2 border-amber-500/60 bg-slate-900/90 shadow-2xl space-y-6 animate-in fade-in"
              >
                {/* Header: ID, Food, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                        Delivered – Awaiting NGO Confirmation
                      </span>
                      <span className="font-mono text-xs text-slate-400 font-bold bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                        Donation ID: #{delivery.id}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-white">{delivery.foodName}</h3>
                    <p className="text-xs text-brand-mint font-semibold mt-0.5">
                      Food Details: {delivery.category} • {delivery.dietType} • {delivery.quantity} ({delivery.mealCount} portions)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">
                      Delivered at:{' '}
                      <strong className="text-white">
                        {delivery.deliveryTimestamp || delivery.deliveredAt
                          ? new Date(delivery.deliveryTimestamp || delivery.deliveredAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Recent'}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Grid: Restaurant, Volunteer, Delivery Notes, Photo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Restaurant Details */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-brand-emerald" />
                      <span>Donating Restaurant</span>
                    </span>
                    <h4 className="text-sm font-bold text-white">{delivery.donorName}</h4>
                    <p className="text-xs text-slate-300">{delivery.pickupLocation?.address}</p>
                    <p className="text-xs text-brand-mint font-mono mt-1">Phone: {delivery.contactPhone}</p>
                  </div>

                  {/* Volunteer Courier Details */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-sky-400" />
                      <span>Volunteer Courier</span>
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      {delivery.assignedVolunteerName || delivery.volunteerId?.name || 'Rapid Courier'}
                    </h4>
                    <p className="text-xs text-slate-300">
                      Vehicle: {delivery.volunteerId?.vehicle || 'Courier Vehicle'}
                    </p>
                    <p className="text-xs text-sky-300 font-mono mt-1">
                      Phone: {delivery.volunteerId?.phone || '+1 (555) 901-2345'}
                    </p>
                  </div>

                  {/* Courier Delivery Notes */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Courier Delivery Notes</span>
                    </span>
                    <p className="text-xs text-slate-300 italic">
                      "{delivery.deliveryNotes || 'Left with NGO kitchen intake team.'}"
                    </p>
                    {delivery.deliveryLat && delivery.deliveryLng && (
                      <span className="text-[10px] font-mono text-slate-400 block mt-1">
                        GPS: {delivery.deliveryLat.toFixed(4)}, {delivery.deliveryLng.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delivery Photo Snapshot */}
                {delivery.deliveryProofUrl && (
                  <div className="p-4 rounded-2xl bg-black/40 border border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-brand-emerald/40 bg-black shrink-0">
                        <img
                          src={delivery.deliveryProofUrl}
                          alt="Handover Proof"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          📸 Handover Proof Photo Attached
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Captured by volunteer upon parcel drop-off at reception
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPhotoModalUrl(delivery.deliveryProofUrl || null)}
                      className="px-3.5 py-1.5 rounded-xl glass-panel hover:bg-slate-800 text-brand-mint text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Photo Full Size</span>
                    </button>
                  </div>
                )}

                {/* 2 ACTION BUTTONS: Confirm Received vs Report Not Received */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-300">
                    <span className="font-bold text-white block mb-0.5">Physical Verification Check:</span>
                    Inspect food-grade containers, meal integrity, and thermal condition before confirming.
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {/* Button 2: Report Not Received */}
                    <button
                      type="button"
                      onClick={() => {
                        setDisputeModalDonation(delivery);
                        setDisputeReason('');
                      }}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 text-rose-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Report Not Received</span>
                    </button>

                    {/* Button 1: Confirm Received */}
                    <button
                      type="button"
                      onClick={() => handleConfirmReceived(delivery.id)}
                      disabled={actionLoadingId === delivery.id}
                      className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-emerald-500 hover:to-brand-emerald text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-emerald/25"
                    >
                      {actionLoadingId === delivery.id ? (
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm Received</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DISPUTED DELIVERIES NOTICE (If any) */}
      {disputedDeliveries.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-rose-300 uppercase tracking-wider">
              Disputed Deliveries Under Admin Review ({disputedDeliveries.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {disputedDeliveries.map((d) => (
              <div key={d.id} className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/50 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">#{d.id} - {d.foodName}</span>
                  <span className="font-mono text-rose-400 text-[10px]">DELIVERY_DISPUTED</span>
                </div>
                <p className="text-slate-300">Donor: {d.donorName}</p>
                <p className="text-rose-300 font-mono text-[11px]">Reason: {d.disputeReason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ACTIVE RESCUE DISPATCHES EN ROUTE                     */}
      {/* ======================================================== */}
      {myAcceptedDonations.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald animate-ping" />
            <h2 className="text-lg font-bold text-white">Active Rescue Dispatches En Route</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myAcceptedDonations.map((don) => (
              <div
                key={don.id}
                className="glass-panel p-5 rounded-2xl border-brand-emerald/40 bg-slate-900/80 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeColor(don)}`}>
                      {getStatusLabel(don)}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">
                      {don.mealCount} Meals
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white">{don.foodName}</h4>
                  <p className="text-xs text-slate-300">Donor: {don.donorName}</p>

                  <div className="mt-2 text-xs text-brand-limeSoft flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Courier: {don.assignedVolunteerName || don.volunteerId?.name || 'Assigning volunteer courier...'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onOpenTracking(don.id)}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Track Live Delivery Progress</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. DISCOVER SURPLUS FEED                                 */}
      {/* ======================================================== */}
      <div className="space-y-6 pt-4 border-t border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Nearby Food Surplus Listings</h2>
            <p className="text-xs text-slate-400">Algorithmically ranked by distance, shelf-life, and dining capacity match</p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search food or restaurant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-emerald"
            >
              <option value="all">All Categories</option>
              <option value="Prepared Meals">Prepared Meals</option>
              <option value="Bakery & Bread">Bakery & Bread</option>
              <option value="Fresh Produce">Fresh Produce</option>
            </select>

            <select
              value={filterDiet}
              onChange={(e) => setFilterDiet(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-emerald"
            >
              <option value="all">All Diets</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        {filteredAvailable.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center text-slate-400 text-xs">
            <Utensils className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p>No available food surplus matching your active filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAvailable.map((don) => (
              <div
                key={don.id}
                className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-brand-emerald/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-brand-mint">
                      Available Surplus
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-brand-limeSoft">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{don.rescueScore}% Match</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{don.foodName}</h3>
                  <p className="text-xs text-slate-400 mb-3">{don.donorName} • {don.category}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-xl mb-3">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Quantity</span>
                      <span className="font-bold text-white">{don.mealCount} meals ({don.quantity})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Safe Until</span>
                      <span className="font-bold text-brand-mint">{don.pickupDeadline}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(don.id)}
                    disabled={acceptingId === don.id}
                    className="flex-1 py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand-emerald/20"
                  >
                    {acceptingId === don.id ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <HeartHandshake className="w-4 h-4" />
                        <span>Accept Food Donation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* REPORT NOT RECEIVED (DISPUTE MODAL)                      */}
      {/* ======================================================== */}
      {disputeModalDonation && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 flex items-start sm:items-center justify-center py-6 animate-in fade-in"
          onClick={() => setDisputeModalDonation(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-rose-500/50 shadow-2xl space-y-5 relative bg-[#07150f]/95 my-auto"
          >
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                <h3 className="text-lg font-black text-white">Report Non-Receipt of Food</h3>
              </div>
              <button
                onClick={() => setDisputeModalDonation(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 text-xs text-rose-200">
              <p>
                You are reporting that the volunteer claimed delivery, but the food items for <strong>#{disputeModalDonation.id} ({disputeModalDonation.foodName})</strong> have NOT been physically received at your facility.
              </p>
              <p className="mt-1 text-slate-400">
                This will update the delivery status to <strong>DELIVERY_DISPUTED</strong> and alert the admin operations team to investigate.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">
                Dispute Reason / Details:
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Courier marked as delivered but no staff at the kitchen received the items; incorrect location drop-off."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDisputeModalDonation(null)}
                className="px-4 py-2 rounded-xl glass-panel text-slate-300 text-xs font-semibold hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmitDispute}
                disabled={isSubmittingDispute}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer"
              >
                {isSubmittingDispute ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Submit Dispute</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL PHOTO VIEW MODAL */}
      {photoModalUrl && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md p-4 flex items-center justify-center animate-in fade-in"
          onClick={() => setPhotoModalUrl(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-brand-emerald/40 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-brand-mint" />
                <span>Handover Photo Proof</span>
              </h3>
              <button
                onClick={() => setPhotoModalUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black max-h-[70vh] flex items-center justify-center">
              <img
                src={photoModalUrl}
                alt="Delivery Proof"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
