import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Mic,
  HelpCircle,
  Headphones,
  BarChart3,
  ChevronRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

export default function AssessmentNavBar({ currentSection = 'A', sessionId = null }) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeSessionId =
    sessionId ||
    location.state?.sessionId ||
    sessionStorage.getItem('bg_assessment_session_id') ||
    'default-session';

  const sections = [
    {
      id: 'A',
      name: 'Section A',
      label: 'Reading & Listening',
      icon: BookOpen,
      path: '/assessment/section-a',
      color: 'blue',
      badge: '23 Qs',
      activeBg: 'bg-blue-600 text-white shadow-blue-500/30',
      inactiveBg: 'bg-white hover:bg-blue-50/60 text-slate-700 border-slate-200 hover:border-blue-200',
    },
    {
      id: 'B',
      name: 'Section B',
      label: 'Speaking Monologue',
      icon: Mic,
      path: '/assessment/section-b',
      color: 'amber',
      badge: '4 Topics',
      activeBg: 'bg-amber-600 text-white shadow-amber-500/30',
      inactiveBg: 'bg-white hover:bg-amber-50/60 text-slate-700 border-slate-200 hover:border-amber-200',
    },
    {
      id: 'C',
      name: 'Section C',
      label: 'Grammar Accuracy',
      icon: HelpCircle,
      path: '/assessment/section-c',
      color: 'emerald',
      badge: '34 Qs',
      activeBg: 'bg-emerald-600 text-white shadow-emerald-500/30',
      inactiveBg: 'bg-white hover:bg-emerald-50/60 text-slate-700 border-slate-200 hover:border-emerald-200',
    },
    {
      id: 'D',
      name: 'Section D',
      label: 'Listening Comprehension',
      icon: Headphones,
      path: '/assessment/section-d',
      color: 'purple',
      badge: '16 Qs',
      activeBg: 'bg-purple-600 text-white shadow-purple-500/30',
      inactiveBg: 'bg-white hover:bg-purple-50/60 text-slate-700 border-slate-200 hover:border-purple-200',
    },
    {
      id: 'results',
      name: 'Results',
      label: 'Scoring & Calibration',
      icon: BarChart3,
      path: '/assessment/results',
      color: 'indigo',
      badge: 'Analysis',
      activeBg: 'bg-indigo-600 text-white shadow-indigo-500/30',
      inactiveBg: 'bg-white hover:bg-indigo-50/60 text-slate-700 border-slate-200 hover:border-indigo-200',
    },
  ];

  const handleNavigate = (path) => {
    navigate(path, { state: { sessionId: activeSessionId } });
  };

  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm rounded-2xl p-3 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Left: Return & Breadcrumb */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/assessment')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-semibold"
            title="Return to Assessment Intro"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            <Sparkles className="w-3.5 h-3.5 text-brain-500" />
            <span>Test Sections:</span>
          </div>
        </div>

        {/* Center / Right: Section Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = currentSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => handleNavigate(sec.path)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap shadow-xs ${
                  isActive
                    ? `${sec.activeBg} ring-2 ring-offset-1 ring-brain-400/50 scale-[1.02]`
                    : sec.inactiveBg
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{sec.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                  }`}
                >
                  {sec.badge}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
