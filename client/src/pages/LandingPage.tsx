import React from 'react';
import { Hero3D } from '../components/Hero3D';
import { LiveImpactCounter } from '../components/LiveImpactCounter';
import { HowItWorks } from '../components/HowItWorks';
import { UserTypeCards } from '../components/UserTypeCards';
import { FoodRescueHeatmap } from '../components/FoodRescueHeatmap';
import { AIIntelligencePanel } from '../components/AIIntelligencePanel';
import { ImpactStats, HeatmapZone, Donation, UserRole } from '../types';
import { Utensils, HeartHandshake, ShieldCheck, Sparkles, ArrowRight, AlertCircle, Leaf } from 'lucide-react';

interface LandingPageProps {
  stats?: ImpactStats;
  zones?: HeatmapZone[];
  donations?: Donation[];
  onOpenDonate: () => void;
  onExploreDonations: () => void;
  onSelectRole: (role: UserRole) => void;
  onSelectDonation: (donation: Donation) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  stats,
  zones,
  donations,
  onOpenDonate,
  onExploreDonations,
  onSelectRole,
  onSelectDonation
}) => {
  return (
    <div className="space-y-12">
      {/* 3D Hero Section */}
      <Hero3D
        onDonateClick={onOpenDonate}
        onExploreClick={onExploreDonations}
      />

      {/* Live Impact Counters */}
      <LiveImpactCounter stats={stats} />

      {/* Storytelling Problem / Solution Section (Requirement 41) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Problem Card */}
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border-red-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold uppercase tracking-wider mb-4">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              The Urban Crisis
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Millions of edible meals discarded every evening
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Commercial kitchens, caterers, and bakeries prepare generous volumes. Often, fresh wholesome food goes unused simply because logistics windows close too fast. Meanwhile, community pantries and shelters struggle with daily food deficits.
            </p>
            <div className="text-3xl font-black text-red-400 font-mono">
              ~35% of Prepared Food Wasted
            </div>
            <p className="text-xs text-slate-400 mt-1">Due to communication latency & fragmented courier networks.</p>
          </div>

          {/* Solution Card */}
          <div className="glass-panel-accent p-8 sm:p-10 rounded-3xl border-brand-emerald/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-emerald/20 rounded-full blur-2xl pointer-events-none" />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-emerald/20 text-brand-mint text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-brand-limeSoft" />
              The Smart Solution
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Instant matchmaking, HACCP safety checks, zero friction
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed mb-6">
              FoodRescue solves the perishability window. Using real-time proximity matching, verified food safety screening, and rapid volunteer dispatch, surplus is matched and moving in under 15 minutes.
            </p>
            <div className="text-3xl font-black text-brand-mint font-mono">
              &lt; 90 Min Full Rescue Velocity
            </div>
            <p className="text-xs text-brand-limeSoft mt-1">From kitchen closing to verified dining hall distribution.</p>
          </div>

        </div>
      </section>

      {/* How It Works 4-Step Interactive Timeline */}
      <HowItWorks />

      {/* User Type Cards */}
      <UserTypeCards onSelectRole={onSelectRole} />

      {/* Interactive Food Rescue Heatmap */}
      <FoodRescueHeatmap
        zones={zones}
        donations={donations}
        onSelectDonation={onSelectDonation}
      />

      {/* Operations Intelligence Panel */}
      <AIIntelligencePanel />

      {/* Call to Action Banner */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-tr from-brand-forest via-brand-card to-brand-dark border border-brand-emerald/40 shadow-2xl relative overflow-hidden text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-emerald/20 text-brand-mint text-xs font-bold uppercase tracking-wider mb-4">
            <Leaf className="w-3.5 h-3.5 text-brand-limeSoft" />
            <span>Join the Closed-Loop Zero-Waste Network</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-3xl mx-auto mb-4">
            Rescue the Next Meal Before Time Runs Out.
          </h2>

          <p className="text-slate-300 text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            Whether you operate a restaurant, lead a charity shelter, or want to courier meals during your evening commute, your city needs you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenDonate}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-emerald-500 hover:to-brand-emerald text-white font-bold text-sm shadow-xl shadow-brand-emerald/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Utensils className="w-4 h-4" />
              <span>Donate Surplus Food</span>
            </button>
            <button
              onClick={onExploreDonations}
              className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel text-slate-200 hover:text-white border-slate-700 font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <HeartHandshake className="w-4 h-4 text-brand-limeSoft" />
              <span>Explore Active Food Surplus</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
