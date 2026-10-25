import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { 
  LayoutDashboard, 
  Timer, 
  CheckSquare, 
  BookOpen, 
  BarChart3, 
  Settings 
} from 'lucide-react';

const mobileNavItems = [
  { name: 'Home', path: '/', icon: LayoutDashboard },
  { name: 'Focus', path: '/focus', icon: Timer },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Study', path: '/study-materials', icon: BookOpen },
  { name: 'Stats', path: '/progress', icon: BarChart3 },
];

export const Layout = () => {
  return (
    <div className="min-h-screen bg-calm-950 text-slate-100 flex flex-col selection:bg-brain-500 selection:text-white">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 lg:pb-0">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-calm-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 flex justify-around">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-medium transition-colors ${
                  isActive ? 'text-brain-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
