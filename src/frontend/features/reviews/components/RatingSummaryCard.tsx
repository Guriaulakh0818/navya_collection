'use client';

import { ShieldCheck, Star } from 'lucide-react';

interface RatingSummaryCardProps {
  summary: {
    averageRating: number;
    totalCount: number;
    percentages: { 5: number; 4: number; 3: number; 2: number; 1: number };
  };
}

export function RatingSummaryCard({ summary }: RatingSummaryCardProps) {
  const {
    averageRating = 0,
    totalCount = 0,
    percentages = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  } = summary || {};

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
      {/* Average Score */}
      <div className="text-center space-y-2 border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0 md:pr-6">
        <div className="text-4xl sm:text-5xl font-extrabold text-navy font-mono">
          {averageRating || '0.0'}
        </div>
        <div className="flex items-center justify-center gap-1 text-amber-500">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`}
            />
          ))}
        </div>
        <p className="text-xs text-slate-500">Based on {totalCount} verified buyer reviews</p>
      </div>

      {/* Star Distribution Progress Bars */}
      <div className="space-y-2 md:col-span-2 text-xs text-slate-600">
        {[5, 4, 3, 2, 1].map((star) => {
          const pct = percentages[star as 1 | 2 | 3 | 4 | 5] || 0;
          return (
            <div key={star} className="flex items-center gap-3">
              <span className="w-12 font-bold flex items-center gap-1 font-mono text-slate-600">
                {star} <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              </span>
              <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-10 text-right font-mono font-bold text-slate-600">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
