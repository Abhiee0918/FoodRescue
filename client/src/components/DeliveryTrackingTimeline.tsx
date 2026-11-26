import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Circle,
  Truck,
  HeartHandshake,
  Utensils,
  PackageCheck,
  Building,
  AlertTriangle,
  XCircle,
  Eye,
  Camera,
  MapPin,
  Calendar,
  UserCheck,
  ShieldCheck,
  X
} from 'lucide-react';
import { Donation } from '../types';

interface DeliveryTrackingTimelineProps {
  donation: Donation;
  compact?: boolean;
}

export const getStatusLabel = (donation: Donation): string => {
  const status = donation.status;
  const deliveryStatus = donation.deliveryStatus;

  if (status === 'delivery_disputed' || deliveryStatus === 'delivery_disputed') {
    return 'Delivery Disputed';
  }
  if (status === 'cancelled' || deliveryStatus === 'delivery_cancelled') {
    return 'Delivery Cancelled';
  }
  if (status === 'completed' || deliveryStatus === 'delivery_confirmed' || donation.ngoConfirmationStatus === 'confirmed') {
    return 'NGO Confirmed – Successfully Delivered';
  }
  if (status === 'delivered_awaiting_ngo_confirmation' || status === 'delivered' || deliveryStatus === 'delivered_awaiting_ngo_confirmation') {
    return 'Delivered – Awaiting NGO Confirmation';
  }
  if (status === 'out_for_delivery' || deliveryStatus === 'out_for_delivery') {
    return 'Out for Delivery';
  }
  if (status === 'picked_up' || deliveryStatus === 'picked_up') {
    return 'Picked Up';
  }
  if (status === 'volunteer_assigned' || status === 'pickup_in_progress' || deliveryStatus === 'volunteer_assigned') {
    return 'Volunteer Assigned';
  }
  if (status === 'accepted' || deliveryStatus === 'ngo_accepted' || donation.acceptedBy) {
    return 'NGO Accepted';
  }
  return 'Donation Created';
};

export const getStatusBadgeColor = (donation: Donation): string => {
  const label = getStatusLabel(donation);
  switch (label) {
    case 'NGO Confirmed – Successfully Delivered':
      return 'bg-emerald-500/20 text-brand-mint border-brand-emerald/40';
    case 'Delivered – Awaiting NGO Confirmation':
      return 'bg-sky-500/20 text-sky-400 border-sky-500/40 animate-pulse';
    case 'Out for Delivery':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'Picked Up':
      return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
    case 'Volunteer Assigned':
      return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
    case 'NGO Accepted':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    case 'Delivery Disputed':
      return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    case 'Delivery Cancelled':
      return 'bg-slate-700/50 text-slate-400 border-slate-600';
    default:
      return 'bg-emerald-950/40 text-brand-limeSoft border-emerald-800/40';
  }
};

export const DeliveryTrackingTimeline: React.FC<DeliveryTrackingTimelineProps> = ({
  donation,
  compact = false
}) => {
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Determine stage progression index (0 to 6)
  const getStageIndex = (): number => {
    const status = donation.status;
    const deliveryStatus = donation.deliveryStatus;

    if (status === 'completed' || deliveryStatus === 'delivery_confirmed' || donation.ngoConfirmationStatus === 'confirmed') return 6;
    if (status === 'delivered_awaiting_ngo_confirmation' || status === 'delivered' || deliveryStatus === 'delivered_awaiting_ngo_confirmation') return 5;
    if (status === 'out_for_delivery' || deliveryStatus === 'out_for_delivery') return 4;
    if (status === 'picked_up' || deliveryStatus === 'picked_up') return 3;
    if (status === 'volunteer_assigned' || status === 'pickup_in_progress' || deliveryStatus === 'volunteer_assigned' || donation.volunteerId) return 2;
    if (status === 'accepted' || deliveryStatus === 'ngo_accepted' || donation.acceptedBy) return 1;
    return 0; // Donation Created
  };

  const currentStage = getStageIndex();
  const isDisputed = donation.status === 'delivery_disputed' || donation.deliveryStatus === 'delivery_disputed';
  const isCancelled = donation.status === 'cancelled' || donation.deliveryStatus === 'delivery_cancelled';
  const isConfirmed = donation.status === 'completed' || donation.deliveryStatus === 'delivery_confirmed' || donation.ngoConfirmationStatus === 'confirmed';

  const stages = [
    {
      id: 'created',
      title: 'Food Donation Created',
      icon: Utensils,
      timestamp: donation.createdAt,
      detail: `${donation.mealCount} meals (${donation.quantity}) registered by ${donation.donorName}`,
    },
    {
      id: 'ngo_accepted',
      title: 'NGO Accepted',
      icon: HeartHandshake,
      timestamp: donation.acceptedBy?.acceptedAt,
      detail: donation.acceptedBy ? `Accepted by ${donation.acceptedBy.ngoName}` : 'Awaiting community charity match',
    },
    {
      id: 'volunteer_assigned',
      title: 'Volunteer Assigned',
      icon: UserCheck,
      timestamp: donation.volunteerId?.assignedAt,
      detail: donation.volunteerId || donation.assignedVolunteerName
        ? `Courier ${donation.assignedVolunteerName || donation.volunteerId?.name} assigned`
        : 'Dispatching nearby volunteer courier',
    },
    {
      id: 'picked_up',
      title: 'Food Picked Up',
      icon: PackageCheck,
      timestamp: donation.pickupTimestamp || donation.pickedUpAt,
      detail: donation.pickupTimestamp || donation.pickedUpAt
        ? `Collected from ${donation.pickupLocation?.address || 'restaurant kitchen'}`
        : 'Volunteer en route to kitchen for collection',
    },
    {
      id: 'out_for_delivery',
      title: 'Out for Delivery',
      icon: Truck,
      timestamp: donation.deliveryStartTimestamp,
      detail: donation.deliveryStartTimestamp
        ? `In transit to ${donation.acceptedBy?.ngoName || 'NGO destination'}`
        : 'Preparing for vehicle dispatch',
    },
    {
      id: 'delivered_awaiting',
      title: 'Volunteer Marked Delivered',
      icon: Clock,
      timestamp: donation.deliveryTimestamp || donation.deliveredAt,
      detail: donation.deliveryTimestamp || donation.deliveredAt
        ? 'Food delivered at location – Awaiting physical reception confirmation'
        : 'Courier arriving at destination',
    },
    {
      id: 'ngo_confirmed',
      title: 'NGO Confirmed Receipt',
      icon: ShieldCheck,
      timestamp: donation.ngoConfirmationTimestamp || donation.completedAt,
      detail: isConfirmed
        ? `Verified & received by ${donation.ngoConfirmedByName || donation.acceptedBy?.ngoName || 'NGO'}`
        : 'Final physical food check & intake record',
    }
  ];

  return (
    <div className="space-y-4">
      {/* Top Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Live Delivery Tracking:
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${getStatusBadgeColor(donation)}`}>
            {getStatusLabel(donation)}
          </span>
        </div>
        {donation.id && (
          <span className="font-mono text-[11px] text-slate-400">
            Order #{donation.id}
          </span>
        )}
      </div>

      {/* Disputed Alert Banner */}
      {isDisputed && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-xs text-rose-200 flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-rose-300 block text-sm">⚠️ Delivery Disputed by NGO</span>
            <p>The recipient NGO reported that this food parcel was not physically received.</p>
            {donation.disputeReason && (
              <p className="p-2 rounded-lg bg-black/40 text-slate-300 border border-rose-900/40 font-mono text-[11px]">
                Reason: {donation.disputeReason}
              </p>
            )}
            <span className="text-slate-400 text-[11px] block mt-1">
              Operations admin has been alerted to review GPS telemetry, courier records, and resolve.
            </span>
          </div>
        </div>
      )}

      {/* Cancelled Alert Banner */}
      {isCancelled && (
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5">
          <XCircle className="w-4 h-4 text-slate-400" />
          <span>This delivery mission was cancelled.</span>
          {donation.disputeResolutionNotes && (
            <span className="text-slate-400">({donation.disputeResolutionNotes})</span>
          )}
        </div>
      )}

      {/* Flipkart-Style Stepper Timeline */}
      <div className={`glass-panel rounded-2xl border border-slate-800/90 ${compact ? 'p-3' : 'p-5'}`}>
        <div className="relative">
          <div className="space-y-4">
            {stages.map((stage, idx) => {
              const isPast = idx < currentStage;
              const isCurrent = idx === currentStage && !isCancelled && !isDisputed;
              const isFuture = idx > currentStage;

              return (
                <div key={stage.id} className="relative flex items-start gap-3.5">
                  {/* Connecting Line */}
                  {idx !== stages.length - 1 && (
                    <div
                      className={`absolute left-[13px] top-[26px] w-[2px] h-[calc(100%+8px)] -ml-[1px] transition-colors ${
                        isPast ? 'bg-brand-emerald' : 'bg-slate-800'
                      }`}
                    />
                  )}

                  {/* Icon Node */}
                  <div className="relative z-10 shrink-0">
                    {isPast ? (
                      <div className="w-7 h-7 rounded-full bg-brand-emerald text-white flex items-center justify-center shadow-md shadow-brand-emerald/30">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-7 h-7 rounded-full bg-brand-emerald/20 border-2 border-brand-emerald text-brand-mint flex items-center justify-center shadow-lg shadow-brand-emerald/40 animate-pulse">
                        <stage.icon className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 text-slate-600 flex items-center justify-center">
                        <Circle className="w-3 h-3 fill-slate-800 text-slate-800" />
                      </div>
                    )}
                  </div>

                  {/* Step Text Details */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <h4
                        className={`text-xs font-bold ${
                          isPast
                            ? 'text-white'
                            : isCurrent
                            ? 'text-brand-mint font-extrabold'
                            : 'text-slate-500'
                        }`}
                      >
                        {stage.title} {isPast && '✓'}
                      </h4>
                      {stage.timestamp && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(stage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' • '}
                          {new Date(stage.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        isCurrent
                          ? 'text-slate-300 font-medium'
                          : isPast
                          ? 'text-slate-400'
                          : 'text-slate-600'
                      }`}
                    >
                      {stage.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION BOX (Displayed when NGO confirms receipt) */}
      {isConfirmed && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-brand-emerald/50 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-emerald/20 text-brand-mint border border-brand-emerald/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">
                “Your donated food has been successfully delivered and received by the NGO.”
              </h4>
              <p className="text-xs text-brand-mint/90 mt-0.5">
                Physical handover verified by charity staff. {donation.mealCount} meals preserved from waste.
              </p>
            </div>
          </div>

          {/* Delivery Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
              <span className="text-slate-400 text-[10px] block font-semibold uppercase">Recipient NGO</span>
              <span className="font-bold text-white block mt-0.5">
                {donation.acceptedBy?.ngoName || 'Hope Community Kitchen'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
              <span className="text-slate-400 text-[10px] block font-semibold uppercase">Volunteer Courier</span>
              <span className="font-bold text-white block mt-0.5">
                {donation.assignedVolunteerName || donation.volunteerId?.name || 'Rapid Courier'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
              <span className="text-slate-400 text-[10px] block font-semibold uppercase">Delivery Date</span>
              <span className="font-mono text-white block mt-0.5">
                {donation.deliveryTimestamp || donation.deliveredAt
                  ? new Date(donation.deliveryTimestamp || donation.deliveredAt!).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                  : 'Delivered'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-slate-800">
              <span className="text-slate-400 text-[10px] block font-semibold uppercase">NGO Confirmation Date</span>
              <span className="font-mono text-brand-mint font-bold block mt-0.5">
                {donation.ngoConfirmationTimestamp || donation.completedAt
                  ? new Date(donation.ngoConfirmationTimestamp || donation.completedAt!).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                  : 'Confirmed'}
              </span>
            </div>
          </div>

          {/* Delivery Proof / Notes if available */}
          {(donation.deliveryProofUrl || donation.deliveryNotes) && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-black/30 border border-slate-800/80 text-xs">
              {donation.deliveryNotes && (
                <div className="text-slate-300 text-[11px]">
                  <span className="text-slate-400 font-semibold">Courier Notes: </span>
                  "{donation.deliveryNotes}"
                </div>
              )}
              {donation.deliveryProofUrl && (
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(true)}
                  className="px-3 py-1.5 rounded-lg glass-panel hover:bg-slate-800 text-brand-mint text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Delivery Photo Proof</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delivery Photo Modal */}
      {showPhotoModal && donation.deliveryProofUrl && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md p-4 flex items-center justify-center animate-in fade-in"
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-brand-emerald/40 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-brand-mint" />
                <h3 className="text-sm font-bold text-white">Volunteer Delivery Proof Photo</h3>
              </div>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black max-h-[70vh] flex items-center justify-center">
              <img
                src={donation.deliveryProofUrl}
                alt="Delivery Handover Proof"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="text-xs text-slate-400">
              Taken by {donation.assignedVolunteerName || donation.volunteerId?.name || 'Courier'} upon handover at {donation.acceptedBy?.ngoName || 'NGO'}.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
