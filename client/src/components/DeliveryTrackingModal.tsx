import React from 'react';
import { X, Navigation, Truck, ExternalLink } from 'lucide-react';
import { Donation } from '../types';
import { DeliveryTrackingTimeline } from './DeliveryTrackingTimeline';

interface DeliveryTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  donation: Donation | null;
  onOpenLiveMap?: (id: string) => void;
}

export const DeliveryTrackingModal: React.FC<DeliveryTrackingModalProps> = ({
  isOpen,
  onClose,
  donation,
  onOpenLiveMap
}) => {
  if (!isOpen || !donation) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 flex items-start sm:items-center justify-center py-6 animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl glass-panel p-6 sm:p-8 rounded-3xl border border-brand-emerald/40 shadow-2xl space-y-6 relative bg-[#07150f]/95 my-auto max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-emerald/20 border border-brand-emerald/40 flex items-center justify-center text-brand-mint shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-mint">
                  Flipkart-Style Food Dispatch Radar
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="font-mono text-xs text-slate-400">#{donation.id}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {donation.foodName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Component */}
        <DeliveryTrackingTimeline donation={donation} />

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800 text-xs">
          <div className="text-slate-400">
            {donation.volunteerId?.name ? (
              <span>Assigned Volunteer: <strong className="text-white">{donation.volunteerId.name}</strong></span>
            ) : (
              <span>Real-time Socket.IO telemetry active</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onOpenLiveMap && donation.volunteerId && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLiveMap(donation.id);
                }}
                className="px-4 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-600 text-white font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md shadow-brand-emerald/20"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Open Live GPS Telemetry Map</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl glass-panel hover:bg-slate-800 text-slate-300 font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
