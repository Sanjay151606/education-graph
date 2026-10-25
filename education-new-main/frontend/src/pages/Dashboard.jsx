import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  AlertTriangle,
  Sparkles,
  Clock,
  CheckCircle,
  FileText,
  ArrowRight,
  BookOpen,
  BarChart3,
  Gamepad2,
  ListTodo,
  Timer,
  CheckSquare,
} from "lucide-react";
import Card from "../components/common/Card";
import StrengthsWeaknessesCard from "../components/dashboard/StrengthsWeaknessesCard";
import StreakBadge from "../components/dashboard/StreakBadge";
import ActivityTimeline from "../components/dashboard/ActivityTimeline";

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [rec, setRec] = useState(null);
  const [loadingRec, setLoadingRec] = useState(true);
  const [unauthorizedMsg, setUnauthorizedMsg] = useState(
    location.state?.unauthorizedError || ""
  );

  useEffect(() => {
    setLoadingRec(true);
    api
      .post("/api/ai/recommendations", {})
      .then((res) => {
        setRec(res.data);
      })
      .catch(() => {})
      .finally(() => {
        setLoadingRec(false);
      });
  }, []);

  const displayName =
    user?.full_name?.split(" ")[0] || user?.name?.split(" ")[0] || "there";

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-150">
      {/* Alert Banner */}
      {unauthorizedMsg && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-center justify-between text-xs font-bold shadow-card">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{unauthorizedMsg}</span>
          </div>
          <button
            onClick={() => setUnauthorizedMsg("")}
            className="text-amber-700 hover:text-amber-950 ml-4 font-bold cursor-pointer"
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Welcome Banner (High contrast WCAG AA compliant gradient) */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-5 sm:p-7 lg:p-8 text-white shadow-card-hover border border-indigo-500/20">
        {/* Subtle decorative background glow */}
        <div
          aria-hidden="true"
          className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-10 right-1/3 w-48 h-48 bg-blue-500/15 rounded-full blur-2xl pointer-events-none"
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Welcome back, {displayName}</span>
                <span className="text-2xl sm:text-3xl animate-wave origin-bottom-right inline-block">
                  👋
                </span>
              </h1>
              <StreakBadge userId={user?.id} />
            </div>
            <p className="text-xs sm:text-sm text-indigo-100 font-medium max-w-xl leading-relaxed">
              Your ADHD-calibrated study system is ready. Take small, low-friction
              steps to build momentum today.
            </p>
          </div>

          <Link
            to="/reports"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer backdrop-blur-sm w-fit shrink-0 focus-visible:ring-2 focus-visible:ring-white"
          >
            <BarChart3 className="w-4 h-4 text-indigo-200" />
            <span>View Progress Reports</span>
            <ArrowRight className="w-3 h-3 text-indigo-200" />
          </Link>
        </div>
      </div>

      {/* Today's AI Recommendations Card */}
      <Card accent="indigo" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                Today's AI Adaptive Recommendations
              </h2>
              <p className="text-[11px] font-semibold text-slate-400">
                Dynamic scaffolding personalized to your energy & mastery level
              </p>
            </div>
          </div>
        </div>

        {loadingRec ? (
          /* Skeleton Loader (3 animated placeholder lines/blocks) */
          <div className="space-y-3 pt-2 animate-pulse" aria-label="Loading recommendations">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-700/80 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-slate-700/80 rounded-md w-3/4" />
                <div className="h-2.5 bg-slate-700/50 rounded-md w-1/2" />
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-700/80 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-slate-700/80 rounded-md w-4/5" />
                <div className="h-2.5 bg-slate-700/50 rounded-md w-2/5" />
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-700/80 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-slate-700/80 rounded-md w-2/3" />
                <div className="h-2.5 bg-slate-700/50 rounded-md w-1/3" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-800">
              <div className="h-7 w-44 bg-slate-800 rounded-xl" />
              <div className="h-7 w-40 bg-slate-800 rounded-xl" />
            </div>
          </div>
        ) : rec && rec.recommendations ? (
          <div className="space-y-4 pt-1">
            {/* Interactive recommendation chips */}
            <div className="space-y-2">
              {rec.recommendations.map((r, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-850/90 hover:bg-indigo-950/70 border border-slate-800 hover:border-indigo-500/50 transition-all flex items-start gap-3 text-xs sm:text-sm text-slate-200 hover:text-white font-medium group cursor-pointer hover:shadow-lg hover:shadow-indigo-500/10 active:scale-[0.99]"
                >
                  <span className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-black text-xs shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed flex-1">{r}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                </div>
              ))}
            </div>

            {/* Suggested focus & break pills */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-800 text-xs font-semibold">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/70 border border-indigo-700/60 text-indigo-200">
                <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Suggested Focus Block:</span>
                <b className="text-white font-black">
                  {rec.suggested_focus_minutes || 25} mins
                </b>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-700/60 text-emerald-200">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Recommended Break:</span>
                <b className="text-white font-black">
                  {rec.suggested_break_minutes || 5} mins
                </b>
              </span>
            </div>

            {rec.motivational_note && (
              <p className="text-xs italic text-indigo-200 bg-indigo-950/40 p-3 rounded-xl border border-indigo-800/50 font-medium">
                "{rec.motivational_note}"
              </p>
            )}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 font-semibold">
            No adaptive recommendations generated yet. Start an activity below!
          </div>
        )}
      </Card>

      {/* Strengths & Weaknesses Topic Map */}
      <StrengthsWeaknessesCard userId={user?.id} />

      {/* Bottom Action Cards Grid with Live Stat Lines & Feature Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Interactive Hub */}
        <Link
          to="/activities"
          className="bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 border border-slate-800/90 border-l-4 border-l-purple-500 shadow-xl hover:shadow-purple-500/10 hover:border-slate-700 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex flex-col justify-between group space-y-4 text-slate-100"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/60 text-purple-300 flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform">
                🎮
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-950/90 text-purple-300 border border-purple-800/60">
                3 Games
              </span>
            </div>
            <div>
              <h3 className="text-sm font-black text-white group-hover:text-purple-300 transition">
                Interactive Hub
              </h3>
              <p className="text-[11px] font-bold text-purple-400 mt-0.5">
                3 micro-exercises ready
              </p>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Match, flashcard & challenge exercises.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-purple-400 gap-1 pt-2 border-t border-slate-800">
            <span>Play Activities</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Manage Tasks */}
        <Link
          to="/tasks"
          className="bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 border border-slate-800/90 border-l-4 border-l-indigo-500 shadow-xl hover:shadow-indigo-500/10 hover:border-slate-700 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex flex-col justify-between group space-y-4 text-slate-100"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform">
                📋
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-950/90 text-indigo-300 border border-indigo-800/60">
                Active
              </span>
            </div>
            <div>
              <h3 className="text-sm font-black text-white group-hover:text-indigo-300 transition">
                Manage Tasks
              </h3>
              <p className="text-[11px] font-bold text-indigo-400 mt-0.5">
                3 due today
              </p>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Break complex work into manageable 15m steps.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-indigo-400 gap-1 pt-2 border-t border-slate-800">
            <span>Open Tasks</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Study Materials */}
        <Link
          to="/materials"
          className="bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 border border-slate-800/90 border-l-4 border-l-emerald-500 shadow-xl hover:shadow-emerald-500/10 hover:border-slate-700 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex flex-col justify-between group space-y-4 text-slate-100"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform">
                📚
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-800/60">
                Updated
              </span>
            </div>
            <div>
              <h3 className="text-sm font-black text-white group-hover:text-emerald-300 transition">
                Study Materials
              </h3>
              <p className="text-[11px] font-bold text-emerald-400 mt-0.5">
                2 new this week
              </p>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Chunked notes & progressive disclosure modules.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-emerald-400 gap-1 pt-2 border-t border-slate-800">
            <span>Explore Notes</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Focus Mode */}
        <Link
          to="/focus"
          className="bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 border border-slate-800/90 border-l-4 border-l-amber-500 shadow-xl hover:shadow-amber-500/10 hover:border-slate-700 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex flex-col justify-between group space-y-4 text-slate-100"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/60 text-amber-300 flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform">
                ⏱️
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-800/60">
                Sprint
              </span>
            </div>
            <div>
              <h3 className="text-sm font-black text-white group-hover:text-amber-300 transition">
                Focus Mode
              </h3>
              <p className="text-[11px] font-bold text-amber-400 mt-0.5">
                4-day streak
              </p>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Low-distraction Pomodoro timer with sounds.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-amber-400 gap-1 pt-2 border-t border-slate-800">
            <span>Start Focus</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Student Activity Log Timeline */}
      <ActivityTimeline userId={user?.id} />
    </div>
  );
}

