import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { X, Navigation, Clock, MapPin, Gauge, Play, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

interface LiveTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  donationId: string;
}

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({
  isOpen,
  onClose,
  donationId
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const volunteerMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isTrackingRealGps, setIsTrackingRealGps] = useState(false);

  useEffect(() => {
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  const handleToggleRealGps = () => {
    if (isTrackingRealGps) {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTrackingRealGps(false);
      return;
    }

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsTrackingRealGps(true);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        if (volunteerMarkerRef.current) {
          volunteerMarkerRef.current.setLatLng(coords);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(coords);
        }
        setTrackingData((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            volunteer: {
              ...prev.volunteer,
              coordinates: coords,
              name: 'You (Real Live GPS)'
            }
          };
        });
      },
      (err) => {
        alert(`Real GPS error: ${err.message}`);
        setIsTrackingRealGps(false);
      },
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
    setWatchId(id);
  };

  useEffect(() => {
    if (!isOpen || !donationId) return;

    api.getTracking(donationId)
      .then(res => {
        setTrackingData(res.tracking);
      })
      .catch(err => console.error('Tracking fetch error:', err))
      .finally(() => setLoading(false));

    // Listen to live socket telemetry updates
    const socket = getSocket();
    const handleLocationUpdate = (payload: any) => {
      if (payload.donationId === donationId) {
        setTrackingData((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            volunteer: {
              ...prev.volunteer,
              coordinates: payload.coordinates,
              distanceKm: payload.distanceKm,
              etaMinutes: payload.etaMinutes
            }
          };
        });

        // Update marker position on map
        if (volunteerMarkerRef.current && payload.coordinates) {
          volunteerMarkerRef.current.setLatLng(payload.coordinates);
        }
      }
    };

    socket.on('pickup:location_update', handleLocationUpdate);

    return () => {
      socket.off('pickup:location_update', handleLocationUpdate);
    };
  }, [isOpen, donationId]);

  // Leaflet map initialization
  useEffect(() => {
    if (!isOpen || !trackingData || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const donorCoords = trackingData.donor.coordinates;
    const ngoCoords = trackingData.ngo.coordinates;
    const volCoords = trackingData.volunteer.coordinates;

    const map = L.map(mapContainerRef.current, {
      center: volCoords,
      zoom: 14,
      scrollWheelZoom: false
    });

    // Real street map tiles (High-res real streets, no watermark, no API key required)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Real Street Map &copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    // Donor Marker (Kitchen icon)
    const donorIcon = L.divIcon({
      className: 'donor-marker',
      html: `<div style="background-color:#10b981;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.5);font-size:16px;">🍳</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    L.marker(donorCoords, { icon: donorIcon }).bindPopup(`<b>Donor:</b> ${trackingData.donor.name}`).addTo(map);

    // NGO Marker (Heart/Shelter icon)
    const ngoIcon = L.divIcon({
      className: 'ngo-marker',
      html: `<div style="background-color:#38bdf8;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.5);font-size:16px;">🏛️</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    L.marker(ngoCoords, { icon: ngoIcon }).bindPopup(`<b>Destination:</b> ${trackingData.ngo.name}`).addTo(map);

    // Volunteer Marker (Vehicle icon)
    const volIcon = L.divIcon({
      className: 'vol-marker',
      html: `<div style="background-color:#a3e635;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #062319;box-shadow:0 4px 14px rgba(163,230,53,0.5);font-size:18px;">🚗</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    const volMarker = L.marker(volCoords, { icon: volIcon }).addTo(map);
    volunteerMarkerRef.current = volMarker;

    // Draw route line
    const routeLine = L.polyline(trackingData.waypoints || [donorCoords, volCoords, ngoCoords], {
      color: '#10b981',
      weight: 4,
      dashArray: '6, 8',
      opacity: 0.8
    }).addTo(map);
    routePolylineRef.current = routeLine;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isOpen, trackingData]);

  if (!isOpen) return null;

  const handleSimulateStep = async () => {
    setSimulating(true);
    try {
      await api.stepTelemetry(donationId);
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
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
          className="w-full max-w-3xl glass-panel p-6 sm:p-8 rounded-3xl border border-brand-emerald/40 shadow-2xl relative my-auto bg-[#07150f]/95"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-brand-mint text-[11px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-brand-emerald animate-ping" />
              Live Telemetry
            </span>
            <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
              Demo tracking (GPS Simulator Mode)
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white">Live Courier Rescue Mission</h3>
          <p className="text-xs text-slate-300">
            {trackingData?.foodName || 'Surplus Meals'} • Mission ID: {donationId}
          </p>
        </div>

        {/* Telemetry Stats Bar */}
        {trackingData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Proximity</span>
              <span className="font-bold text-white text-base">
                {trackingData.volunteer.distanceKm} km away
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Estimated Arrival</span>
              <span className="font-bold text-brand-mint text-base">
                {trackingData.volunteer.etaMinutes} mins
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mission Status</span>
              <span className="font-bold text-brand-limeSoft text-base">
                On the way
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Courier Speed</span>
              <span className="font-bold text-sky-400 text-base">
                {trackingData.volunteer.speedKmh} km/h
              </span>
            </div>
          </div>
        )}

        {/* Leaflet Map Frame */}
        <div className="h-[340px] w-full rounded-2xl overflow-hidden border border-slate-800 relative shadow-inner">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Bottom controls */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-brand-mint shrink-0" />
            <span>Courier: <strong className="text-white">{trackingData?.volunteer?.name}</strong> ({trackingData?.volunteer?.vehicle})</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleToggleRealGps}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                isTrackingRealGps
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>{isTrackingRealGps ? 'Tracking Live GPS' : '📍 Use Real Device GPS'}</span>
            </button>

            <button
              onClick={handleSimulateStep}
              disabled={simulating}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-emerald-500 hover:to-brand-emerald text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-emerald/20 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Courier Advance</span>
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
            >
              <X className="w-4 h-4" />
              <span>Back / Close</span>
            </button>
          </div>
        </div>

      </motion.div>
      </div>
    </div>
  );
};
