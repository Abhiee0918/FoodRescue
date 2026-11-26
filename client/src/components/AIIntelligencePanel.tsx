import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Bot, AlertTriangle, ArrowUpRight, Zap, Clock, ShieldCheck } from 'lucide-react';
import { LiveInsight } from '../types';
import { api } from '../services/api';

export const AIIntelligencePanel: React.FC = () => {
  const [insights, setInsights] = useState<LiveInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLiveInsights()
      .then(res => setInsights(res.insights))
      .catch(() => {
        // Fallback demo insights
        setInsights([
          {
            id: 'ins_1',
            title: 'Immediate Surplus Availability',
            text: '165 meals across 3 active listings are currently available within 3.5 km.',
            type: 'opportunity',
            priority: 'high'
          },
          {
            id: 'ins_2',
            title: 'NGO Receptivity',
            text: '3 nearby partner NGOs currently have active volunteer reception teams on duty.',
            type: 'capacity',
            priority: 'optimal'
          },
          {
            id: 'ins_3',
            title: 'Optimal Dispatch Window',
            text: 'System recommends scheduling pickups between 17:30 and 19:45 to avoid peak urban congestion.',
            type: 'timing',
            priority: 'guidance'
          },
          {
            id: 'ins_4',
            title: 'Safe Window Threshold',
            text: '1 listing approaching 3-hour safe consumption threshold — prioritized for express courier pickup.',
            type: 'warning',
            priority: 'urgent'
          }
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-20 relative overflow-hidden bg-brand-surface/50 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Glowing Neural Orb + Overview */}
          <div className="lg:col-span-5 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-brand-mint text-xs font-semibold uppercase tracking-wider mb-4">
              <Bot className="w-3.5 h-3.5 text-brand-limeSoft" />
              Autonomous Dispatch Intelligence
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              FoodRescue <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint via-brand-emerald to-brand-limeSoft">
                Operational Insights Feed
              </span>
            </h2>

            <p className="mt-3 text-slate-300 text-sm leading-relaxed max-w-md">
              Continuous neural telemetry scanning kitchen prep timelines, cold-chain stability, and dining hall bed capacity to optimize rapid food transfers.
            </p>

            {/* Glowing Interactive Neural Orb */}
            <div className="relative mt-8 w-44 h-44 flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full border border-brand-emerald/40 animate-ping opacity-25" />
              <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-brand-emerald/20 via-brand-lime/10 to-transparent blur-xl" />
              
              {/* Core Orb */}
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                transition={{ rotate: { duration: 20, repeat: Infinity, ease: 'linear' }, scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
                className="w-36 h-36 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-700 to-lime-600 p-[2px] shadow-2xl shadow-brand-emerald/40 relative flex items-center justify-center"
              >
                <div className="w-full h-full rounded-full bg-brand-dark/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
                  <Sparkles className="w-7 h-7 text-brand-limeSoft mb-1 animate-pulse" />
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">HACCP Safety</span>
                  <span className="text-[10px] text-brand-mint">Live Engine Active</span>
                </div>
              </motion.div>
            </div>

            <p className="text-[11px] text-slate-400 mt-4 max-w-xs text-center lg:text-left">
              *Safety analysis is advisory and informational. Human safety checks are maintained throughout distribution.
            </p>
          </div>

          {/* Right Column: Real-Time Intelligence Stream Cards */}
          <div className="lg:col-span-7 space-y-4">
            {insights.map((insight, idx) => {
              const isUrgent = insight.priority === 'urgent' || insight.type === 'warning';

              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className={`glass-panel p-5 rounded-2xl flex items-start gap-4 border transition-all hover:bg-slate-900/80 ${
                    isUrgent ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isUrgent
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-brand-mint border border-emerald-500/30'
                    }`}
                  >
                    {isUrgent ? <AlertTriangle className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-white truncate">{insight.title}</h4>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isUrgent ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-brand-mint'
                        }`}
                      >
                        {insight.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{insight.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
