import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/' },
  { name: 'Assessment', path: '/assessment', highlight: true },
  { name: 'Focus Sprint', path: '/focus' },
  { name: 'Micro-Tasks', path: '/tasks' },
  { name: 'Study Materials', path: '/study-materials' },
  { name: 'Progress Analytics', path: '/progress' },
  { name: 'ADHD Settings', path: '/settings' },
];


export const Sidebar = () => {
  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block border-r border-slate-800/80 bg-calm-950/50 p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-brain-600/20 text-brain-300 border border-brain-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">{item.name}</span>
              {item.highlight && (
                <span className="ml-auto flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-focus-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-focus-500"></span>
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* ADHD Micro-Coach Card */}
      <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-brain-950/80 to-slate-900 border border-brain-500/20 shadow-md">
        <div className="flex items-center gap-2 text-brain-400 mb-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">ADHD Tip</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Stuck on a task? Don't plan the whole project. Just execute a 2-minute micro-step.
        </p>
      </div>
    </aside>
  );
};
