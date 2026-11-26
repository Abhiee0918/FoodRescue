import React from 'react';
import { Utensils, ShieldCheck, Heart, Sparkles, ExternalLink, Globe, Share2 } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenDonate: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenDonate }) => {
  return (
    <footer className="bg-brand-dark border-t border-slate-800 text-slate-400 text-xs pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-emerald to-brand-lime flex items-center justify-center text-brand-dark font-bold shadow-md">
                <Utensils className="w-5 h-5 stroke-[2.4]" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                FoodRescue
              </span>
            </div>

            <p className="text-slate-300 text-sm max-w-sm leading-relaxed">
              “Turning surplus into impact.” FoodRescue connects commercial kitchens, food banks, and rapid couriers in real time to eliminate edible waste.
            </p>

            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <span className="text-xs">Certified Zero-Waste Initiative</span>
              <span>•</span>
              <span className="text-xs">HACCP Telemetry</span>
            </div>
          </div>

          {/* Product Col */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => onNavigate('landing')} className="hover:text-white transition-colors cursor-pointer">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={onOpenDonate} className="hover:text-white transition-colors cursor-pointer text-brand-mint font-semibold">
                  Donate Surplus Food
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard-ngo')} className="hover:text-white transition-colors cursor-pointer">
                  Find Food Donations
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard-volunteer')} className="hover:text-white transition-colors cursor-pointer">
                  Volunteer Courier
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('heatmap')} className="hover:text-white transition-colors cursor-pointer">
                  Surplus Heatmap Radar
                </button>
              </li>
            </ul>
          </div>

          {/* Platform Col */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-4">Platform</h4>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => onNavigate('impact')} className="hover:text-white transition-colors cursor-pointer">
                  Environmental Impact
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('landing')} className="hover:text-white transition-colors cursor-pointer">
                  Food Safety Protocols
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard-admin')} className="hover:text-white transition-colors cursor-pointer">
                  Admin Oversight HQ
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Safety Col */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-4">Safety & Legal</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('Privacy Policy: All food donor coordinates & telemetry comply with regional data governance.'); }} className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" onClick={(e) => { e.preventDefault(); alert('Terms of Service: Platform facilitates non-profit charitable food redistribution.'); }} className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#disclaimer" onClick={(e) => { e.preventDefault(); alert('Food Safety Disclaimer: System guidance is informational only. Donors and NGOs must abide by local sanitary regulations.'); }} className="hover:text-white transition-colors text-amber-400/90 font-semibold">
                  Food Safety Disclaimer
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Regulatory Disclaimer Banner */}
        <div className="mt-8 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <strong className="text-slate-300 font-semibold">Mandatory Food Safety Notice:</strong> Automated guidance is informational only. Follow applicable food-safety regulations, sanitary handoff procedures, and local municipal health authority guidelines. Visual checks cannot replace certified laboratory micro-biological testing.
        </div>

        {/* Bottom Credits */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 FoodRescue Inc. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Rescue Food. Reduce Waste. Feed Communities.</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
