import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Utensils, Scale, CheckCircle2, HeartHandshake, Users, Leaf, Droplet } from 'lucide-react';
import { ImpactStats } from '../types';

interface LiveImpactCounterProps {
  stats?: ImpactStats;
}

const NumberCounter: React.FC<{ value: number; suffix?: string; duration?: number }> = ({
  value,
  suffix = '',
  duration = 2000
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const startValue = 0;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutExpo
      const current = Math.floor(progress === 1 ? value : value * (1 - Math.pow(2, -10 * progress)));
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };

    requestAnimationFrame(step);
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

export const LiveImpactCounter: React.FC<LiveImpactCounterProps> = ({ stats }) => {
  const defaultStats: ImpactStats = {
    mealsRescued: 12842,
    foodSavedKg: 4280,
    donationsCompleted: 326,
    ngosConnected: 48,
    volunteersActive: 152,
    co2eAvoidedKg: 10700,
    waterSavedLiters: 1712000,
    landfillsDivertedTons: 4.28
  };

  const current = stats || defaultStats;

  const counterItems = [
    {
      label: 'Meals Rescued',
      value: current.mealsRescued,
      suffix: '',
      icon: Utensils,
      color: 'from-emerald-400 to-brand-mint',
      desc: 'Nutritious meals served to families in need'
    },
    {
      label: 'Food Saved',
      value: current.foodSavedKg,
      suffix: ' kg',
      icon: Scale,
      color: 'from-brand-lime to-lime-300',
      desc: 'Edible food diverted from municipal landfills'
    },
    {
      label: 'Donations Completed',
      value: current.donationsCompleted,
      suffix: '',
      icon: CheckCircle2,
      color: 'from-teal-400 to-emerald-400',
      desc: 'Verified seamless handoffs from donor to NGO'
    },
    {
      label: 'NGOs Connected',
      value: current.ngosConnected,
      suffix: '',
      icon: HeartHandshake,
      color: 'from-sky-400 to-blue-400',
      desc: 'Certified distribution kitchens & shelters'
    },
    {
      label: 'Volunteers Active',
      value: current.volunteersActive,
      suffix: '',
      icon: Users,
      color: 'from-amber-400 to-yellow-300',
      desc: 'Rapid-response couriers and transport heroes'
    }
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-brand-mint text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
            Live Platform Telemetry
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Measurable Humanitarian & Ecological Impact
          </h2>
          <p className="mt-3 text-slate-300 text-base">
            Every transaction is cryptographically tracked to verify edible food preservation, carbon reduction, and community nutrition.
          </p>
        </div>

        {/* 5 Animated Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          {counterItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between group"
              >
                {/* Glow pill behind icon */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-emerald/10 rounded-full blur-2xl group-hover:bg-brand-emerald/20 transition-all pointer-events-none" />

                <div>
                  <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-5 group-hover:border-brand-emerald/40 transition-colors">
                    <Icon className="w-6 h-6 text-brand-mint group-hover:scale-110 transition-transform" />
                  </div>

                  <div className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-1">
                    <span className={`text-transparent bg-clip-text bg-gradient-to-r ${item.color}`}>
                      <NumberCounter value={item.value} suffix={item.suffix} />
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-200 mt-1">
                    {item.label}
                  </h3>
                </div>

                <p className="text-xs text-slate-400 mt-4 leading-relaxed border-t border-slate-800/80 pt-3">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Supplementary Environmental Footprint Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 glass-panel-accent p-6 rounded-2xl border border-brand-emerald/30 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-emerald/20 flex items-center justify-center text-brand-limeSoft">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-300 uppercase tracking-wider font-semibold">Environmental Offset Equivalent</p>
              <h4 className="text-lg font-bold text-white">
                ~{Math.round(current.foodSavedKg * 2.5).toLocaleString()} kg CO₂e Emissions Prevented
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-sky-400" />
              <span>~{Math.round(current.foodSavedKg * 400).toLocaleString()} Liters Water Footprint Saved</span>
            </div>
            <div className="hidden sm:block text-slate-500">•</div>
            <div className="text-xs text-slate-400 max-w-xs">
              Based on EPA & FAO food waste avoidance lifecycle indicators.
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
