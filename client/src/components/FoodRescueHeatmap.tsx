import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { HeatmapZone, Donation } from '../types';
import { Flame, Shield, Users, Utensils, MapPin, Eye, CheckCircle2 } from 'lucide-react';

interface FoodRescueHeatmapProps {
  zones?: HeatmapZone[];
  donations?: Donation[];
  onSelectDonation?: (donation: Donation) => void;
}

export const FoodRescueHeatmap: React.FC<FoodRescueHeatmapProps> = ({
  zones = [],
  donations = [],
  onSelectDonation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [selectedZone, setSelectedZone] = useState<HeatmapZone | null>(null);
  const [activeLayer, setActiveLayer] = useState<'all' | 'surplus' | 'demand' | 'coverage'>('all');
  const [mapBaseType, setMapBaseType] = useState<'streets' | 'satellite' | 'osm'>('streets');
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 15, { animate: true, duration: 1.5 });

          const liveIcon = L.divIcon({
            className: 'live-user-marker',
            html: `
              <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(14, 165, 233, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="position: relative; width: 18px; height: 18px; border-radius: 50%; background: #0284c7; border: 3px solid #ffffff; box-shadow: 0 0 10px rgba(2, 132, 199, 0.9);"></div>
              </div>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          });

          const m = L.marker([latitude, longitude], { icon: liveIcon }).addTo(mapInstanceRef.current);
          m.bindPopup(`
            <div style="padding: 6px; font-family: sans-serif; color: #fff;">
              <strong style="color: #38bdf8; font-size: 13px;">📍 You Are Here (Live GPS)</strong><br />
              <span style="font-size: 11px; color: #cbd5e1;">Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}</span><br />
              <span style="font-size: 10px; color: #94a3b8;">Accuracy: ±${Math.round(accuracy)}m</span>
            </div>
          `).openPopup();
        }
      },
      (err) => {
        setLocating(false);
        alert(`Location access denied or unavailable: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Default fallback zones if not passed
  const activeZones = zones.length > 0 ? zones : [
    {
      id: 'zone_1',
      name: 'Downtown Commercial & Hotel Strip',
      center: [12.9140, 74.8550] as [number, number],
      radiusKm: 2.2,
      surplusLevel: 'High' as const,
      demandLevel: 'Medium' as const,
      ngoCoverage: 'Strong (4 active centers)',
      volunteerCount: 8,
      status: 'optimal_rescue' as const,
      color: '#10b981',
      details: 'High restaurant density. Fast 14-min average volunteer pickup response.'
    },
    {
      id: 'zone_2',
      name: 'Old Port Community & Shelter Row',
      center: [12.9320, 74.8380] as [number, number],
      radiusKm: 2.5,
      surplusLevel: 'Low' as const,
      demandLevel: 'High' as const,
      ngoCoverage: 'Critical Need (High unmet volume)',
      volunteerCount: 3,
      status: 'high_demand' as const,
      color: '#f59e0b',
      details: 'High concentration of community feeding centers needing surplus redirection.'
    },
    {
      id: 'zone_3',
      name: 'East Suburb Retail & Tech Park',
      center: [12.8950, 74.8720] as [number, number],
      radiusKm: 3.0,
      surplusLevel: 'High' as const,
      demandLevel: 'Low' as const,
      ngoCoverage: 'Moderate (2 centers)',
      volunteerCount: 5,
      status: 'surplus_heavy' as const,
      color: '#38bdf8',
      details: 'Large corporate cafeterias; surplus peaks between 14:00 and 16:30 daily.'
    }
  ];

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Center on Mangalore coordinates
    const map = L.map(mapContainerRef.current, {
      center: [12.9170, 74.8520],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: false
    });

    // Real Street Map (Esri World Street Map - No API key needed, zero watermark, high-res real roads and landmarks)
    const initialTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; High-Res Real Street Map &copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = initialTile;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map tile provider dynamically (Streets, Satellite, OpenStreetMap)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
    let attribution = 'Tiles &copy; Esri &mdash; High-Res Real Street Map &copy; OpenStreetMap';

    if (mapBaseType === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri &mdash; High-Resolution Satellite Photography';
    } else if (mapBaseType === 'osm') {
      url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    }

    const newLayer = L.tileLayer(url, {
      attribution,
      maxZoom: 19
    }).addTo(map);

    // Keep tiles beneath markers
    newLayer.bringToBack();
    tileLayerRef.current = newLayer;
  }, [mapBaseType]);

  // Update map layers & markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers/circles
    map.eachLayer((layer) => {
      if (layer instanceof L.Circle || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Draw Heatmap Zones
    activeZones.forEach((zone) => {
      if (
        (activeLayer === 'surplus' && zone.status !== 'surplus_heavy') ||
        (activeLayer === 'demand' && zone.status !== 'high_demand') ||
        (activeLayer === 'coverage' && zone.status !== 'optimal_rescue')
      ) {
        return;
      }

      const circle = L.circle(zone.center, {
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: 0.22,
        radius: zone.radiusKm * 1000,
        weight: 2
      }).addTo(map);

      circle.on('click', () => {
        setSelectedZone(zone);
      });
    });

    // Add Donation Markers
    donations.forEach((donation) => {
      const lat = donation.pickupLocation.lat || 12.9141;
      const lng = donation.pickupLocation.lng || 74.8560;

      const customIcon = L.divIcon({
        className: 'custom-pin-marker',
        html: `
          <div style="background-color: #10b981; width: 34px; height: 34px; border-radius: 50%; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.5);">
            <span style="font-size: 16px;">🍲</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      // Glassmorphism Popup
      const popupHtml = `
        <div style="padding: 10px; font-family: sans-serif; min-width: 200px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="background: rgba(16,185,129,0.2); color: #6ee7b7; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">
              ${donation.mealCount} Meals Available
            </span>
            <span style="color: #94a3b8; font-size: 11px;">${donation.dietType}</span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 14px; color: #ffffff; font-weight: bold;">
            ${donation.foodName}
          </h4>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #cbd5e1;">
            ${donation.donorName}
          </p>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            ⏰ Pickup before ${donation.pickupDeadline}
          </div>
          <button id="btn-view-${donation.id}" style="width: 100%; background: #10b981; color: #ffffff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 12px; cursor: pointer;">
            View Donation Details
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-view-${donation.id}`);
        if (btn && onSelectDonation) {
          btn.onclick = () => onSelectDonation(donation);
        }
      });
    });

  }, [activeZones, donations, activeLayer, onSelectDonation]);

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-brand-mint text-xs font-semibold uppercase tracking-wider mb-3">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Special Feature — Real-Time Surplus Radar
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Interactive Food Rescue Heatmap
            </h2>
            <p className="mt-2 text-slate-300 text-sm max-w-2xl">
              Live geographic visualization mapping supply concentrations, community food pantries, and rapid-dispatch courier zones.
            </p>
          </div>

          {/* Map Controls: Real Map Switcher + Live GPS + Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Real Map Style Switcher */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMapBaseType('streets')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  mapBaseType === 'streets'
                    ? 'bg-brand-emerald text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Real Street Map with real roads, avenues, and landmarks"
              >
                <span>🗺️ Real Streets</span>
              </button>
              <button
                type="button"
                onClick={() => setMapBaseType('satellite')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  mapBaseType === 'satellite'
                    ? 'bg-brand-emerald text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Real Photographic Satellite Imagery"
              >
                <span>🛰️ Satellite</span>
              </button>
              <button
                type="button"
                onClick={() => setMapBaseType('osm')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  mapBaseType === 'osm'
                    ? 'bg-brand-emerald text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="OpenStreetMap Standard"
              >
                <span>🌐 OpenStreetMap</span>
              </button>
            </div>

            <button
              onClick={handleLocateMe}
              disabled={locating}
              className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
              title="Detect and center map on my current GPS location"
            >
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>{locating ? 'Locating...' : '📍 Locate Me (Live GPS)'}</span>
            </button>

            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setActiveLayer('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeLayer === 'all' ? 'bg-brand-emerald text-white' : 'text-slate-400 hover:text-white'}`}
              >
                All Zones
              </button>
              <button
                onClick={() => setActiveLayer('coverage')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeLayer === 'coverage' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Strong NGO Coverage
              </button>
              <button
                onClick={() => setActiveLayer('demand')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeLayer === 'demand' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                High Unmet Demand
              </button>
              <button
                onClick={() => setActiveLayer('surplus')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeLayer === 'surplus' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                High Surplus Zones
              </button>
            </div>
          </div>
        </div>

        {/* Map Container + Floating Zone Info Drawer */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 glass-panel shadow-2xl h-[520px]">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Map Overlay Key */}
          <div className="absolute top-4 left-4 z-[500] glass-panel p-3.5 rounded-xl border-slate-800/80 text-xs space-y-2 pointer-events-auto">
            <p className="font-bold text-white text-[11px] uppercase tracking-wider mb-1">Zone Status Key</p>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
              <span>Green: Strong NGO Coverage</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
              <span>Yellow: High Unmet Demand</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-sky-500 shadow-sm" />
              <span>Blue: Surplus Supply Hub</span>
            </div>
          </div>

          {/* Selected Zone Glassmorphism Card */}
          {selectedZone && (
            <div className="absolute bottom-4 right-4 z-[500] w-80 glass-panel p-5 rounded-2xl border-brand-emerald/40 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-start justify-between mb-3">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: `${selectedZone.color}25`, color: selectedZone.color }}
                >
                  {selectedZone.status.replace('_', ' ')}
                </span>
                <button
                  onClick={() => setSelectedZone(null)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <h4 className="font-bold text-white text-base mb-1">{selectedZone.name}</h4>
              <p className="text-xs text-slate-300 mb-4">{selectedZone.details}</p>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800 pt-3">
                <div className="bg-slate-900/60 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Surplus Level</span>
                  <span className="font-bold text-white">{selectedZone.surplusLevel}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Demand Level</span>
                  <span className="font-bold text-white">{selectedZone.demandLevel}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Coverage</span>
                  <span className="font-bold text-white">{selectedZone.ngoCoverage}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Couriers Active</span>
                  <span className="font-bold text-brand-mint">{selectedZone.volunteerCount} on standby</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
