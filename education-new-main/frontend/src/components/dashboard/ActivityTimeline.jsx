import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/client";
import { Clock, RefreshCw, Calendar, Sparkles, CheckCircle, BookOpen, HelpCircle, Flame, Layers } from "lucide-react";
import Card from "../common/Card";
import EmptyState from "../common/EmptyState";

const ACTIVITY_ICONS = {
  task_completed: { icon: "✅", label: "Completed Task", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  material_viewed: { icon: "📖", label: "Reviewed Notes", color: "text-blue-700 bg-blue-50 border-blue-200" },
  quiz_attempted: { icon: "🎯", label: "Completed Activity", color: "text-purple-700 bg-purple-50 border-purple-200" },
  focus_session_started: { icon: "⏱️", label: "Started Focus Sprint", color: "text-amber-700 bg-amber-50 border-amber-200" },
  focus_session_ended: { icon: "🏁", label: "Finished Focus Sprint", color: "text-slate-700 bg-slate-50 border-slate-200" },
  doubt_asked: { icon: "💬", label: "Asked AI Tutor", color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  break_taken: { icon: "☕", label: "Took Dopamine Break", color: "text-teal-700 bg-teal-50 border-teal-200" },
  material_bookmarked: { icon: "🔖", label: "Bookmarked Concept", color: "text-rose-700 bg-rose-50 border-rose-200" },
};

export default function ActivityTimeline({ userId }) {
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rangeFilter, setRangeFilter] = useState("week"); // today | week | month

  const loadTimeline = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await api.get(`/activity/${userId}?range=${rangeFilter}`);
      setTimelineData(res.data);
    } catch (err) {
      console.warn("Could not load activity timeline:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, rangeFilter]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const groups = timelineData?.groups || { today: [], yesterday: [], this_week: [], earlier: [] };
  const total = timelineData?.total_activities || 0;

  const renderGroup = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
          {title} ({items.length})
        </div>
        <div className="space-y-1.5">
          {items.map((item) => {
            const config = ACTIVITY_ICONS[item.activity_type] || {
              icon: "⚡",
              label: item.activity_type.replace(/_/g, " "),
              color: "text-slate-700 bg-slate-50 border-slate-200",
            };

            const titleText =
              item.metadata?.title ||
              item.metadata?.question ||
              item.metadata?.topic ||
              config.label;

            const score = item.metadata?.score;

            return (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm hover:border-indigo-500/40 transition flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base leading-none shrink-0">{config.icon}</span>
                  <div className="min-w-0 truncate">
                    <span className="font-bold text-slate-100 truncate block">
                      {titleText}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 capitalize">
                      {config.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {score !== undefined && score !== null && (
                    <span className="px-2 py-0.5 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-800/60 font-bold text-[10px]">
                      {score}%
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-slate-400 font-medium">
                    {item.time_formatted}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner">
            <Clock className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-black text-white">Student Activity Timeline</h3>
            <p className="text-[11px] font-semibold text-slate-400">
              Real-time trace of completed tasks, notes reviewed, and exercises
            </p>
          </div>
        </div>

        {/* Range Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl w-fit border border-slate-700/60">
          {["today", "week", "month"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRangeFilter(r)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold capitalize transition cursor-pointer ${
                rangeFilter === r
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400 font-semibold space-y-2">
          <RefreshCw className="w-4 h-4 animate-spin mx-auto text-indigo-400" />
          <span>Loading activity log…</span>
        </div>
      ) : total === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
          <p className="text-xs font-bold text-slate-300">No activity recorded for this period</p>
          <p className="text-[11px] text-slate-400">
            Complete a task or study module to begin populating your timeline!
          </p>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {renderGroup("Today", groups.today)}
          {renderGroup("Yesterday", groups.yesterday)}
          {renderGroup("Earlier This Week", groups.this_week)}
          {renderGroup("Earlier", groups.earlier)}
        </div>
      )}
    </Card>
  );
}
