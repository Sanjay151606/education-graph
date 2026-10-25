import React from 'react';

export const CardSkeleton = ({ rows = 3 }) => {
  return (
    <div className="glass-panel rounded-3xl p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-1/3 bg-slate-800 rounded-xl" />
        <div className="h-5 w-16 bg-slate-800/80 rounded-full" />
      </div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-slate-800/60 rounded-lg"
            style={{ width: `${100 - (i % 3) * 15}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export const TaskSkeleton = () => {
  return (
    <div className="glass-panel rounded-2xl p-4 flex items-center gap-4 animate-pulse">
      <div className="w-5 h-5 bg-slate-800 rounded-md flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/5 bg-slate-800 rounded-lg" />
        <div className="h-3 w-1/4 bg-slate-800/60 rounded-lg" />
      </div>
      <div className="h-6 w-14 bg-slate-800/60 rounded-xl" />
    </div>
  );
};

export const StatSkeleton = () => {
  return (
    <div className="glass-panel rounded-3xl p-5 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 bg-slate-800 rounded-lg" />
        <div className="w-8 h-8 bg-slate-800 rounded-xl" />
      </div>
      <div className="h-8 w-24 bg-slate-800 rounded-xl" />
      <div className="h-3 w-32 bg-slate-800/50 rounded-lg" />
    </div>
  );
};

export const ChartSkeleton = () => {
  return (
    <div className="glass-panel rounded-3xl p-6 space-y-4 animate-pulse">
      <div className="h-6 w-1/4 bg-slate-800 rounded-xl" />
      <div className="h-64 w-full bg-slate-800/40 rounded-2xl flex items-end justify-between p-4 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="w-full bg-slate-800/60 rounded-t-xl"
            style={{ height: `${20 + (i * 12) % 70}%` }}
          />
        ))}
      </div>
    </div>
  );
};
