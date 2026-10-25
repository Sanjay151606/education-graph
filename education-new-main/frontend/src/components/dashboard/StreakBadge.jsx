import React, { useState, useEffect } from "react";
import api from "../../api/client";
import { Flame, Sparkles } from "lucide-react";

export default function StreakBadge({ userId }) {
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStreak() {
      if (!userId) return;
      try {
        const res = await api.get(`/activity/${userId}/streak`);
        setStreakData(res.data);
      } catch (err) {
        console.warn("Could not load streak:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStreak();
  }, [userId]);

  if (loading) {
    return (
      <div className="h-8 w-24 bg-white/10 rounded-2xl animate-pulse backdrop-blur-xs" />
    );
  }

  const days = streakData?.current_streak_days || 1;
  const activeToday = streakData?.active_today;

  return (
    <div
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/15 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md transition-all shadow-xs"
      title={`${days} consecutive day(s) of learning momentum`}
    >
      <span className="text-base leading-none">🔥</span>
      <div className="text-left">
        <div className="text-xs font-black tracking-tight leading-none">
          {days} {days === 1 ? "Day" : "Days"} Streak
        </div>
        <span className="text-[10px] font-semibold text-amber-200/90 leading-none">
          {activeToday ? "Active today" : "Ready to learn"}
        </span>
      </div>
    </div>
  );
}
