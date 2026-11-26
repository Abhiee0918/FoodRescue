import React from 'react';
import { motion } from 'framer-motion';
import { Utensils, HeartHandshake, Bike, Check, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { UserRole } from '../types';

interface UserTypeCardsProps {
  onSelectRole: (role: UserRole) => void;
}

export const UserTypeCards: React.FC<UserTypeCardsProps> = ({ onSelectRole }) => {
  const cards = [
    {
      role: 'restaurant' as UserRole,
      title: 'Restaurant & Event Organizer',
      tagline: 'Turn surplus meals into community impact.',
      icon: Utensils,
      color: 'from-emerald-500 to-teal-400',
      badge: 'Food Providers',
      features: [
        'Rapid multi-step surplus food registration',
        'Food safety compliance assessment',
        'Direct connection to certified local NGOs',
        'Historical waste diversion metrics & ESG reporting'
      ],
      cta: 'Donate Food',
      demoLoginNote: 'Test as Chef Marcus (Green Leaf Bistro)'
    },
    {
      role: 'ngo' as UserRole,
      title: 'NGO & Community Charity',
      tagline: 'Discover nearby food donations and coordinate pickups.',
      icon: HeartHandshake,
      color: 'from-brand-lime to-emerald-500',
      badge: 'Relief Kitchens & Pantries',
      features: [
        'Real-time nearby food availability radar',
        'Compatibility matching based on dining capacity',
        'One-click acceptance and route scheduling',
        'Real-time courier telemetry tracking',
        'Comprehensive hunger relief logs & meal distribution records'
      ],
      cta: 'Find Donations',
      demoLoginNote: 'Test as Sarah (Hope Community Kitchen)'
    },
    {
      role: 'volunteer' as UserRole,
      title: 'Rapid Volunteer Courier',
      tagline: 'Help move rescued food from donors to communities.',
      icon: Bike,
      color: 'from-sky-400 to-emerald-400',
      badge: 'First-Responder Couriers',
      features: [
        'Instant pickup dispatch notifications',
        'GPS turn-by-turn routing with temperature guidance',
        'Physical delivery verification and photo proof tracking',
        'Eco-mobility carbon footprint tracking',
        'Personal badges, delivery logs & community impact rating'
      ],
      cta: 'Become a Volunteer',
      demoLoginNote: 'Test as Alex (Rapid Courier Driver)'
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-brand-mint text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-limeSoft" />
            Designed For Every Ecosystem Partner
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            How Would You Like to Make an Impact?
          </h2>
          <p className="mt-4 text-slate-300 text-lg">
            Choose your role to access tailored workflows, dedicated dashboards, and specialized tooling.
          </p>
        </div>

        {/* 3 Interactive Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {cards.map((card, idx) => {
            const Icon = card.icon;

            return (
              <motion.div
                key={card.role}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="glass-panel glass-panel-hover p-8 rounded-3xl flex flex-col justify-between relative group border-slate-800"
              >
                <div>
                  {/* Top pill & icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/50">
                      {card.badge}
                    </span>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${card.color} text-brand-dark shadow-xl group-hover:scale-105 transition-transform`}>
                      <Icon className="w-7 h-7 stroke-[2.2]" />
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-300 mb-6 font-medium">
                    {card.tagline}
                  </p>

                  {/* Feature Checklist */}
                  <ul className="space-y-3 mb-8 border-t border-slate-800/80 pt-6">
                    {card.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                        <div className="w-5 h-5 rounded-full bg-brand-emerald/20 text-brand-mint flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Bottom CTA */}
                <div>
                  <button
                    onClick={() => onSelectRole(card.role)}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-emerald-500 hover:to-brand-emerald text-white font-semibold text-base shadow-lg shadow-brand-emerald/20 transition-all flex items-center justify-center gap-2 group-hover:shadow-brand-emerald/35 cursor-pointer"
                  >
                    <span>{card.cta}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="text-center mt-3 text-xs text-slate-400">
                    💡 <span className="text-slate-300 font-medium">{card.demoLoginNote}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
