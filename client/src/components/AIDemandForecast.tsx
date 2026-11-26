import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, AlertCircle, Calendar, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { DemandPrediction } from '../types';
import { api } from '../services/api';

export const AIDemandForecast: React.FC = () => {
  const [forecasts, setForecasts] = useState<DemandPrediction[]>([]);
  const [selectedZoneIdx, setSelectedZoneIdx] = useState(0);

  useEffect(() => {
    api.getDemandPredictions()
      .then(res => setForecasts(res.forecasts))
      .catch(() => {
        // Fallback demo data
        setForecasts([
          {
            zone: 'Central Urban Core',
            expectedDemand: 'High',
            confidence: 84,
            predictionWindow: 'Next 7 Days',
            mostRequested: 'Prepared Hot Meals & High-Protein Dishes',
            historicalDailyMeals: 145,
            predictedDailyMeals: 210,
            trend: '+44.8%',
            ngoCapacityIndex: 'Moderate (72% utilized)',
            surplusRiskProbability: 'Medium-High (Fri/Sat evenings)',
            recommendedAction: 'Target catering halls on Friday 18:00–22:00 window.',
            weeklyChart: [
              { day: 'Mon', historical: 120, predicted: 140 },
              { day: 'Tue', historical: 135, predicted: 155 },
              { day: 'Wed', historical: 140, predicted: 170 },
              { day: 'Thu', historical: 150, predicted: 185 },
              { day: 'Fri', historical: 190, predicted: 280 },
              { day: 'Sat', historical: 210, predicted: 310 },
              { day: 'Sun', historical: 160, predicted: 230 }
            ]
          },
          {
            zone: 'Riverside & Harbor Community',
            expectedDemand: 'Critical High',
            confidence: 89,
            predictionWindow: 'Next 7 Days',
            mostRequested: 'Bulk Rice/Grains, Fresh Milk & Produce Bags',
            historicalDailyMeals: 220,
            predictedDailyMeals: 340,
            trend: '+54.5%',
            ngoCapacityIndex: 'Near Ceiling (91% utilized)',
            surplusRiskProbability: 'High',
            recommendedAction: 'Pre-allocate 3 additional cargo volunteers to Harbor route.',
            weeklyChart: [
              { day: 'Mon', historical: 180, predicted: 260 },
              { day: 'Tue', historical: 195, predicted: 280 },
              { day: 'Wed', historical: 210, predicted: 300 },
              { day: 'Thu', historical: 230, predicted: 330 },
              { day: 'Fri', historical: 270, predicted: 410 },
              { day: 'Sat', historical: 290, predicted: 440 },
              { day: 'Sun', historical: 240, predicted: 360 }
            ]
          },
          {
            zone: 'East Sector & University District',
            expectedDemand: 'Moderate',
            confidence: 76,
            predictionWindow: 'Next 7 Days',
            mostRequested: 'Bakery items, Sandwiches, Grab-and-go boxes',
            historicalDailyMeals: 90,
            predictedDailyMeals: 115,
            trend: '+27.7%',
            ngoCapacityIndex: 'Good Reserve (48% utilized)',
            surplusRiskProbability: 'Low',
            recommendedAction: 'Direct excess bakery surplus here for weekend student food pantries.',
            weeklyChart: [
              { day: 'Mon', historical: 70, predicted: 85 },
              { day: 'Tue', historical: 80, predicted: 100 },
              { day: 'Wed', historical: 85, predicted: 110 },
              { day: 'Thu', historical: 95, predicted: 125 },
              { day: 'Fri', historical: 110, predicted: 145 },
              { day: 'Sat', historical: 120, predicted: 150 },
              { day: 'Sun', historical: 90, predicted: 110 }
            ]
          }
        ]);
      });
  }, []);

  const current = forecasts[selectedZoneIdx];

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-brand-mint text-xs font-semibold uppercase tracking-wider mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-brand-limeSoft" />
              Machine Learning Predictive Analytics
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Demand & Surplus Forecasting
            </h2>
            <p className="mt-2 text-slate-300 text-sm max-w-xl">
              Anticipate localized food deficits and prep courier capacity before hunger emergencies emerge.
            </p>
          </div>

          {/* Zone Selector Pills */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold overflow-x-auto">
            {forecasts.map((f, idx) => (
              <button
                key={f.zone}
                onClick={() => setSelectedZoneIdx(idx)}
                className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedZoneIdx === idx
                    ? 'bg-brand-emerald text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.zone}
              </button>
            ))}
          </div>
        </div>

        {current && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Summary Metrics Cards */}
            <div className="lg:col-span-4 space-y-4">
              <div className="glass-panel p-6 rounded-2xl border-brand-emerald/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Demand Level</span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-brand-mint text-xs font-bold">
                    {current.expectedDemand}
                  </span>
                </div>

                <div className="text-3xl font-extrabold text-white mb-1">
                  {current.zone}
                </div>
                <div className="flex items-center gap-2 text-brand-limeSoft text-xs font-semibold mb-6">
                  <TrendingUp className="w-4 h-4" />
                  <span>Predicted Shift: {current.trend}</span>
                </div>

                <div className="space-y-3 border-t border-slate-800 pt-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Model Confidence:</span>
                    <span className="font-bold text-white">{current.confidence}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Prediction Window:</span>
                    <span className="font-bold text-white">{current.predictionWindow}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Most Requested Food:</span>
                    <span className="font-bold text-brand-mint text-right max-w-[180px]">{current.mostRequested}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">NGO Dining Capacity:</span>
                    <span className="font-bold text-slate-200">{current.ngoCapacityIndex}</span>
                  </div>
                </div>

                {/* Suggested Action Box */}
                <div className="mt-6 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs">
                  <div className="text-brand-limeSoft font-bold mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Recommended Dispatch Strategy</span>
                  </div>
                  <p className="text-slate-300">{current.recommendedAction}</p>
                </div>
              </div>

              {/* Transparency Notice */}
              <div className="p-4 rounded-xl glass-panel border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Predictions are calculated algorithmically from historic donation logs, seasonal events, and municipal demographic inputs.
                </span>
              </div>
            </div>

            {/* Right: Interactive Historical vs Predicted Chart */}
            <div className="lg:col-span-8 glass-panel p-6 sm:p-8 rounded-3xl border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white">Daily Meals Demand Velocity</h3>
                  <p className="text-xs text-slate-400">Comparing 30-day baseline vs. next 7-day predicted need</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-3 h-3 rounded-full bg-slate-500" />
                    Historical Average
                  </span>
                  <span className="flex items-center gap-1.5 text-brand-mint">
                    <span className="w-3 h-3 rounded-full bg-brand-emerald" />
                    Predicted Need
                  </span>
                </div>
              </div>

              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={current.weeklyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="historyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f241a', borderColor: '#10b981', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="historical" stroke="#64748b" fillOpacity={1} fill="url(#historyGrad)" name="Historical" strokeWidth={2} />
                    <Area type="monotone" dataKey="predicted" stroke="#10b981" fillOpacity={1} fill="url(#predictedGrad)" name="Predicted Demand" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

            </div>

          </div>
        )}

      </div>
    </section>
  );
};
