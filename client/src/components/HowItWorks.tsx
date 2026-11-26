import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Cpu, Truck, CheckCheck, ShieldCheck, Zap } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'Donate Surplus',
      subtitle: 'Upload with Safety Telemetry',
      icon: UploadCloud,
      color: 'from-emerald-500 to-teal-400',
      description: 'Restaurants and event organizers log surplus batches with meal counts, prep time, storage temperature, and pickup windows. The system immediately analyzes HACCP safety margins.',
      highlight: 'Sub-60s multi-step flow with instant image verification'
    },
    {
      num: '02',
      title: 'Smart Match',
      subtitle: 'Compatibility Engine',
      icon: Cpu,
      color: 'from-brand-lime to-emerald-400',
      description: 'Our proprietary matching model calculates real-time compatibility across distance, NGO dining capacity, dietary alignment, and remaining safe consumption thresholds.',
      highlight: 'Algorithmic 0–100% compatibility score prioritizing fastest distribution'
    },
    {
      num: '03',
      title: 'Rescue & Dispatch',
      subtitle: 'Volunteer or Direct Transport',
      icon: Truck,
      color: 'from-sky-400 to-emerald-500',
      description: 'The NGO accepts the parcel, and nearby verified volunteer couriers receive dispatch notifications. Couriers confirm pickup and start delivery to the destination.',
      highlight: 'Live turn-by-turn routing with simulated telemetry'
    },
    {
      num: '04',
      title: 'Deliver & Impact',
      subtitle: 'Certified Community Distribution',
      icon: CheckCheck,
      color: 'from-amber-400 to-brand-lime',
      description: 'Food arrives at the NGO shelter or kitchen, verified physically by NGO staff to confirm delivery and close the loop.',
      highlight: 'Verified physical reception & live carbon offset ledger'
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-brand-dark/40 border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel text-brand-limeSoft text-xs font-semibold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" />
            Zero-Waste Closed Loop Logistics
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            How FoodRescue Works
          </h2>
          <p className="mt-4 text-slate-300 text-lg">
            From commercial kitchen surplus to someone’s warm plate in under 90 minutes.
          </p>
        </div>

        {/* 4 Steps Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          
          {/* Connector Line on Desktop */}
          <div className="hidden lg:block absolute top-24 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-emerald-500/20 via-brand-lime/30 to-emerald-500/20 z-0 pointer-events-none" />

          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;

            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                onClick={() => setActiveStep(idx)}
                className={`glass-panel p-6 rounded-2xl relative z-10 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? 'border-brand-emerald shadow-2xl shadow-brand-emerald/15 scale-[1.02] bg-brand-card/90'
                    : 'glass-panel-hover'
                }`}
              >
                <div>
                  {/* Step Number + Icon Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-200 to-slate-500 font-mono">
                      {step.num}
                    </span>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${step.color} text-brand-dark shadow-lg`}>
                      <Icon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-xl font-bold text-white mb-1">
                    {step.title}
                  </h3>
                  <p className="text-xs text-brand-mint font-semibold uppercase tracking-wider mb-4">
                    {step.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    {step.description}
                  </p>
                </div>

                {/* Highlight Chip */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs text-brand-limeSoft font-medium">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{step.highlight}</span>
                </div>
              </motion.div>
            );
          })}
        </div>



      </div>
    </section>
  );
};
