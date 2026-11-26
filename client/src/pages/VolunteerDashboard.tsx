import React, { useState } from 'react';
import {
  Bike,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  QrCode,
  AlertTriangle,
  Play,
  ArrowRight,
  ShieldCheck,
  Check,
  Camera,
  UploadCloud,
  FileText,
  X,
  PackageCheck,
  Truck,
  Building,
  Info
} from 'lucide-react';
import { Donation, User } from '../types';
import { api } from '../services/api';
import { getStatusLabel, getStatusBadgeColor } from '../components/DeliveryTrackingTimeline';

interface VolunteerDashboardProps {
  user: User;
  donations: Donation[];
  onAssignVolunteer: (id: string) => void;
  onOpenTracking: (donationId: string) => void;
}

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({
  user,
  donations,
  onAssignVolunteer,
  onOpenTracking
}) => {
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Delivery Completion Modal State
  const [markingDonation, setMarkingDonation] = useState<Donation | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryPhotoUrl, setDeliveryPhotoUrl] = useState('');
  const [captureGps, setCaptureGps] = useState(true);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);

  // Available requests: accepted by NGO but waiting for a volunteer
  const availablePickups = donations.filter(d => d.status === 'accepted');

  // "My Deliveries": missions assigned to this volunteer or actively in delivery pipeline
  const myDeliveries = donations.filter(d => {
    const isAssignedToMe = d.assignedVolunteerId === user.id || d.volunteerId?.id === user.id;
    const isDeliveryStatus = [
      'volunteer_assigned',
      'pickup_in_progress',
      'picked_up',
      'out_for_delivery',
      'delivered_awaiting_ngo_confirmation',
      'delivery_disputed'
    ].includes(d.status);

    return isAssignedToMe || (isDeliveryStatus && (user.role === 'admin' || !d.volunteerId || isAssignedToMe));
  });

  // Completed missions
  const completedMissions = donations.filter(d =>
    d.status === 'completed' || d.deliveryStatus === 'delivery_confirmed'
  );

  const totalMeals = completedMissions.reduce((acc, d) => acc + (d.mealCount || 0), 0) + 1420;
  const totalKm = (completedMissions.length * 4.2 + 184.5).toFixed(1);

  const handleAcceptTask = async (id: string) => {
    setAcceptingId(id);
    try {
      await onAssignVolunteer(id);
    } finally {
      setAcceptingId(null);
    }
  };

  // Button 2: Confirm Pickup
  const handleConfirmPickup = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.confirmPickup(id);
    } catch (err: any) {
      alert(err.message || 'Failed to confirm pickup');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Button 3: Start Delivery
  const handleStartDelivery = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.startDelivery(id);
    } catch (err: any) {
      alert(err.message || 'Failed to start delivery');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open "Mark as Delivered" Modal
  const openMarkDeliveredModal = (donation: Donation) => {
    setMarkingDonation(donation);
    setDeliveryNotes('');
    setDeliveryPhotoUrl('');
    // Try acquiring GPS coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setGpsCoords(null);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  // Handle Photo File Upload (Convert to Data URL)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setDeliveryPhotoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Mark as Delivered
  const handleSubmitMarkDelivered = async () => {
    if (!markingDonation) return;
    setIsSubmittingDelivery(true);
    try {
      await api.markDelivered(markingDonation.id, {
        deliveryProofUrl: deliveryPhotoUrl || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80',
        deliveryNotes: deliveryNotes || 'Handed over directly to NGO shelter intake desk.',
        deliveryLat: captureGps && gpsCoords ? gpsCoords.lat : undefined,
        deliveryLng: captureGps && gpsCoords ? gpsCoords.lng : undefined
      });
      setMarkingDonation(null);
    } catch (err: any) {
      alert(err.message || 'Failed to mark delivery');
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-emerald/40 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-emerald/20 text-brand-mint text-xs font-bold uppercase tracking-wider mb-2">
            <span>🚴 First-Responder Courier Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {user.role === 'admin' || user.name.includes('Admin') || user.name.includes('Operations')
              ? 'FoodRescue Operations'
              : (user.organizationName && user.organizationName !== user.name
                  ? `${user.name} (${user.organizationName})`
                  : (user.name || 'FoodRescue Operations'))}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Vehicle: {user.vehicleType || 'Eco Hatchback (Thermal Insulated)'} • Status: <span className="text-brand-mint font-bold">Active On Standby</span>
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-slate-300 shrink-0 max-w-sm">
          <span className="text-brand-limeSoft font-bold block mb-0.5">🏆 Courier Distinction:</span>
          Level 4 Certified Food Courier • Flipkart-Style Real-time Telemetry Enabled
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Available Pickups</span>
          <span className="text-3xl font-black text-brand-mint">{availablePickups.length}</span>
          <span className="text-[11px] text-slate-400 block mt-2">Ready for transport</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">My Active Deliveries</span>
          <span className="text-3xl font-black text-white">{myDeliveries.length}</span>
          <span className="text-[11px] text-brand-limeSoft block mt-2">Currently in transit</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Meals Delivered</span>
          <span className="text-3xl font-black text-sky-400">{totalMeals.toLocaleString()}</span>
          <span className="text-[11px] text-slate-400 block mt-2">Portions safeguarded</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Distance Logged</span>
          <span className="text-3xl font-black text-amber-400">{totalKm} km</span>
          <span className="text-[11px] text-slate-400 block mt-2">Eco-courier tracking</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. MY DELIVERIES SECTION                                 */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald animate-ping" />
            <h2 className="text-xl font-extrabold text-white">My Deliveries ({myDeliveries.length})</h2>
          </div>
          <span className="text-xs text-slate-400">Assigned Missions & Chain-of-Custody Steps</span>
        </div>

        {myDeliveries.length === 0 ? (
          <div className="glass-panel p-10 rounded-3xl text-center text-slate-400 text-xs">
            <Bike className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p>You have no active deliveries assigned. Choose an available request below.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {myDeliveries.map((delivery) => {
              const status = delivery.status;
              const isAssigned = status === 'volunteer_assigned' || status === 'pickup_in_progress';
              const isPickedUp = status === 'picked_up';
              const isOutForDelivery = status === 'out_for_delivery';
              const isAwaitingConfirmation = status === 'delivered_awaiting_ngo_confirmation' || status === 'delivered';
              const isDisputed = status === 'delivery_disputed';

              return (
                <div
                  key={delivery.id}
                  className="glass-panel p-6 sm:p-8 rounded-3xl border-2 border-brand-emerald/50 bg-slate-900/90 shadow-2xl space-y-6 animate-in fade-in"
                >
                  {/* Top Bar: ID, Food, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${getStatusBadgeColor(delivery)}`}>
                          {getStatusLabel(delivery)}
                        </span>
                        <span className="font-mono text-xs text-slate-400 font-bold bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                          Donation ID: #{delivery.id}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-white">{delivery.foodName}</h3>
                      <p className="text-xs text-brand-mint font-semibold mt-0.5">
                        Volume / Portions: {delivery.quantity} • {delivery.mealCount} meals ({delivery.category || 'Surplus Food'})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenTracking(delivery.id)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Navigation className="w-4 h-4 text-brand-limeSoft" />
                        <span>Live GPS Telemetry</span>
                      </button>
                    </div>
                  </div>

                  {/* Locations & Instructions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Restaurant Location & Pickup Instructions */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <MapPin className="w-4 h-4 text-brand-emerald" />
                        <span className="uppercase tracking-wider">Restaurant (Pickup Source)</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{delivery.donorName}</h4>
                      <p className="text-xs text-slate-300">{delivery.pickupLocation.address}</p>
                      <p className="text-xs text-brand-mint font-mono">Contact Phone: {delivery.contactPhone}</p>
                      <div className="pt-2 border-t border-slate-800/80">
                        <span className="text-[11px] font-bold text-slate-400 block mb-0.5">📋 Pickup Instructions:</span>
                        <p className="text-xs text-slate-300 italic bg-black/40 p-2.5 rounded-xl border border-slate-900">
                          {delivery.pickupInstructions || 'Report to staff service entrance with delivery container.'}
                        </p>
                      </div>
                    </div>

                    {/* NGO Location & Delivery Instructions */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Building className="w-4 h-4 text-sky-400" />
                        <span className="uppercase tracking-wider">NGO (Delivery Destination)</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        {delivery.acceptedBy?.ngoName || 'Hope Community Kitchen'}
                      </h4>
                      <p className="text-xs text-slate-300">Community Dining Hall Entrance, Receiving Bay</p>
                      <p className="text-xs text-sky-300 font-mono">Staff Intake Team on Standby</p>
                      <div className="pt-2 border-t border-slate-800/80">
                        <span className="text-[11px] font-bold text-slate-400 block mb-0.5">📦 Delivery Instructions:</span>
                        <p className="text-xs text-slate-300 italic bg-black/40 p-2.5 rounded-xl border border-slate-900">
                          {delivery.deliveryInstructions || 'Deliver to shelter reception/kitchen intake desk.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Disputed Alert Banner */}
                  {isDisputed && (
                    <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-xs text-rose-200 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-rose-300 block text-sm">Delivery Disputed</span>
                        <p>The recipient NGO reported that they have not received this parcel ({delivery.disputeReason || 'Unconfirmed'}). Admin operations team will investigate.</p>
                      </div>
                    </div>
                  )}

                  {/* Awaiting Confirmation Banner */}
                  {isAwaitingConfirmation && (
                    <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/40 text-xs text-sky-200 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-sky-400 shrink-0 mt-0.5 animate-spin" />
                      <div>
                        <span className="font-bold text-sky-300 block text-sm">
                          Delivered – Awaiting NGO Confirmation
                        </span>
                        <p>
                          You have marked this delivery at the destination. The NGO staff is currently verifying the physical food parcels and will confirm receipt to complete the mission.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 4 ACTION BUTTONS PIPELINE (Flipkart Style Workflow) */}
                  <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PackageCheck className="w-4 h-4 text-brand-mint" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Delivery Action Pipeline
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">Step through workflow below</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Button 1: Accept Delivery */}
                      <button
                        type="button"
                        onClick={() => handleAcceptTask(delivery.id)}
                        disabled={!availablePickups.some(d => d.id === delivery.id) && isAssigned}
                        className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          !isAssigned && !isPickedUp && !isOutForDelivery && !isAwaitingConfirmation
                            ? 'bg-brand-emerald hover:bg-emerald-600 text-white cursor-pointer shadow-lg shadow-brand-emerald/20'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 cursor-default opacity-80'
                        }`}
                      >
                        <Bike className="w-4 h-4" />
                        <span>1. Accept Delivery {isAssigned || isPickedUp || isOutForDelivery || isAwaitingConfirmation ? '✓' : ''}</span>
                      </button>

                      {/* Button 2: Confirm Pickup */}
                      <button
                        type="button"
                        onClick={() => handleConfirmPickup(delivery.id)}
                        disabled={!isAssigned || actionLoadingId === delivery.id}
                        className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          isAssigned
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-lg shadow-amber-500/20 font-black animate-pulse'
                            : isPickedUp || isOutForDelivery || isAwaitingConfirmation
                            ? 'bg-slate-900 text-brand-mint border border-slate-800 cursor-default font-semibold'
                            : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>
                          {actionLoadingId === delivery.id ? 'Confirming...' : '2. Confirm Pickup'}
                          {isPickedUp || isOutForDelivery || isAwaitingConfirmation ? ' ✓' : ''}
                        </span>
                      </button>

                      {/* Button 3: Start Delivery */}
                      <button
                        type="button"
                        onClick={() => handleStartDelivery(delivery.id)}
                        disabled={!isPickedUp || actionLoadingId === delivery.id}
                        className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          isPickedUp
                            ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer shadow-lg shadow-sky-500/20 font-black animate-pulse'
                            : isOutForDelivery || isAwaitingConfirmation
                            ? 'bg-slate-900 text-brand-mint border border-slate-800 cursor-default font-semibold'
                            : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                        <span>
                          {actionLoadingId === delivery.id ? 'Starting...' : '3. Start Delivery'}
                          {isOutForDelivery || isAwaitingConfirmation ? ' ✓' : ''}
                        </span>
                      </button>

                      {/* Button 4: Mark as Delivered */}
                      <button
                        type="button"
                        onClick={() => openMarkDeliveredModal(delivery)}
                        disabled={(!isOutForDelivery && !isPickedUp) || isAwaitingConfirmation}
                        className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          isOutForDelivery
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 cursor-pointer shadow-lg shadow-emerald-500/25 font-black animate-pulse'
                            : isAwaitingConfirmation
                            ? 'bg-sky-950/60 text-sky-300 border border-sky-800/60 cursor-default'
                            : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {isAwaitingConfirmation ? '4. Delivered (Pending NGO)' : '4. Mark as Delivered'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. AVAILABLE PICKUP OPPORTUNITIES                        */}
      {/* ======================================================== */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h2 className="text-xl font-bold text-white">Available Courier Dispatch Requests</h2>
        <p className="text-xs text-slate-400">Accepted by charities, awaiting volunteer transportation</p>

        {availablePickups.length === 0 ? (
          <div className="glass-panel p-10 rounded-3xl text-center text-slate-400 text-xs">
            <Check className="w-8 h-8 text-brand-mint mx-auto mb-2" />
            <p>All active donations currently have transportation assigned.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availablePickups.map((don) => (
              <div
                key={don.id}
                className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                      Awaiting Courier
                    </span>
                    <span className="text-xs font-bold text-brand-limeSoft font-mono">
                      {don.mealCount} Meals ({don.quantity})
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{don.foodName}</h3>
                  <p className="text-xs text-slate-300 mb-3">Donor: {don.donorName}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-xl mb-3">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Destination</span>
                      <span className="font-bold text-white">{don.acceptedBy?.ngoName || 'Partner Charity'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Deadline</span>
                      <span className="font-bold text-brand-mint">{don.pickupDeadline}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleAcceptTask(don.id)}
                    disabled={acceptingId === don.id}
                    className="w-full py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-brand-emerald/20 transition-all"
                  >
                    {acceptingId === don.id ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <Bike className="w-4 h-4" />
                        <span>Accept Delivery Mission</span>
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
      {/* 3. COMPLETED DELIVERIES ARCHIVE                          */}
      {/* ======================================================== */}
      {completedMissions.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-xl font-bold text-white">Completed Delivery Archive</h2>
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Food Batch</th>
                  <th className="p-4">Donor</th>
                  <th className="p-4">Recipient</th>
                  <th className="p-4 text-right">Meals Rescued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {completedMissions.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/40">
                    <td className="p-4 font-bold text-white">{m.foodName}</td>
                    <td className="p-4">{m.donorName}</td>
                    <td className="p-4">{m.acceptedBy?.ngoName || 'Charity'}</td>
                    <td className="p-4 text-right font-mono font-bold text-brand-mint">{m.mealCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MARK AS DELIVERED MODAL (Photo, Notes, GPS)              */}
      {/* ======================================================== */}
      {markingDonation && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 flex items-start sm:items-center justify-center py-6 animate-in fade-in"
          onClick={() => setMarkingDonation(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl glass-panel p-6 sm:p-8 rounded-3xl border border-brand-emerald/40 shadow-2xl space-y-6 relative bg-[#07150f]/95 my-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-mint">
                  Step 4: Delivery Handover
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  Mark as Delivered
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Handing over: {markingDonation.foodName} to {markingDonation.acceptedBy?.ngoName || 'NGO'}
                </p>
              </div>
              <button
                onClick={() => setMarkingDonation(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Crucial Notice */}
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-300">Status will become: DELIVERED_AWAITING_NGO_CONFIRMATION</strong>
                Final completion requires the NGO staff to physically verify the items and click "Confirm Received".
              </div>
            </div>

            <div className="space-y-4">
              {/* Photo Upload with Preview */}
              <div>
                <label className="text-xs font-bold text-white block mb-1.5">
                  📸 Delivery Proof Photo (Handover Snapshot)
                </label>
                <div className="space-y-2">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-brand-emerald/60 rounded-2xl p-4 cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition-colors">
                    <Camera className="w-6 h-6 text-brand-mint mb-1" />
                    <span className="text-xs text-slate-300 font-semibold">Click to upload or take photo</span>
                    <span className="text-[10px] text-slate-500">PNG, JPG, or WEBP photo of parcel handover</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {deliveryPhotoUrl && (
                    <div className="relative rounded-xl overflow-hidden border border-brand-emerald/40 max-h-48 bg-black flex items-center justify-center">
                      <img
                        src={deliveryPhotoUrl}
                        alt="Delivery Proof Preview"
                        className="max-h-48 w-auto object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setDeliveryPhotoUrl('')}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-rose-400 hover:text-white"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Notes */}
              <div>
                <label className="text-xs font-bold text-white block mb-1.5">
                  📝 Delivery Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Left with Chef Sarah at intake counter, sealed containers checked."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald"
                />
              </div>

              {/* GPS Coordinates Checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={captureGps}
                  onChange={(e) => setCaptureGps(e.target.checked)}
                  className="rounded border-slate-700 text-brand-emerald focus:ring-brand-emerald"
                />
                <span>
                  Record current GPS delivery telemetry coordinates
                  {gpsCoords && <span className="text-brand-mint font-mono text-[11px] ml-1">({gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)})</span>}
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setMarkingDonation(null)}
                className="px-4 py-2.5 rounded-xl glass-panel text-slate-300 text-xs font-semibold hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmitMarkDelivered}
                disabled={isSubmittingDelivery}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-emerald-500 hover:to-brand-emerald text-white text-xs font-bold shadow-lg shadow-brand-emerald/25 flex items-center gap-2 cursor-pointer"
              >
                {isSubmittingDelivery ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Delivery for NGO Confirmation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
