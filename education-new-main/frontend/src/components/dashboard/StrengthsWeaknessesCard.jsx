import React, { useState, useEffect } from "react";
import api from "../../api/client";
import { Award, TrendingUp, AlertTriangle, Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import Card from "../common/Card";

export default function StrengthsWeaknessesCard({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await api.get(`/api/ai/strengths-weaknesses/${userId}`);
        setData(res.data);
      } catch (err) {
        console.warn("Could not load strengths/weaknesses:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  if (loading) {
    return (
      <Card className="animate-pulse space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-200" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-slate-200 rounded-md w-1/4" />
            <div className="h-3 bg-slate-200/70 rounded-md w-1/3" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="h-32 bg-slate-100 rounded-2xl" />
          <div className="h-32 bg-slate-100 rounded-2xl" />
        </div>
      </Card>
    );
  }

  const strengths = data?.strengths || [];
  const growthAreas = data?.growth_areas || [];

  const visibleStrengths = expanded ? strengths : strengths.slice(0, 3);
  const visibleGrowth = expanded ? growthAreas : growthAreas.slice(0, 3);
  const hasMore = strengths.length > 3 || growthAreas.length > 3;

  return (
    <Card accent="purple" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-inner">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white">
              AI Topic Mastery Profile
            </h3>
            <p className="text-[11px] font-semibold text-slate-400">
              Personalized strengths & scaffolded growth areas
            </p>
          </div>
        </div>

        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs font-bold text-purple-300 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-800/60 transition-colors cursor-pointer"
          >
            <span>{expanded ? "Show less" : `See all (${Math.max(strengths.length, growthAreas.length)})`}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Strengths Column (Top Superpowers) */}
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-200">
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Top Superpowers (Strengths)</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-700/60">
              {strengths.length} Mastered
            </span>
          </div>

          <div className="space-y-2.5">
            {visibleStrengths.length > 0 ? (
              visibleStrengths.map((item, i) => {
                const score = Number(item.score) || 0;
                return (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base leading-none shrink-0">{item.badge || "⭐"}</span>
                        <span className="font-bold text-slate-100 truncate">{item.topic}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-400 ml-2 shrink-0">
                        {score}%
                      </span>
                    </div>
                    {/* Horizontal Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500 ease-out shadow-sm shadow-emerald-500/30"
                        style={{ width: `${Math.min(Math.max(score, 5), 100)}%` }}
                        aria-label={`Mastery score: ${score}%`}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 font-semibold text-center py-4">
                Complete assessments to unlock superpowers!
              </p>
            )}
          </div>
        </div>

        {/* Growth Areas Column */}
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Growth Areas (Needs Practice)</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-900/80 text-amber-300 border border-amber-700/60">
              {growthAreas.length} Scaffolded
            </span>
          </div>

          <div className="space-y-2.5">
            {visibleGrowth.length > 0 ? (
              visibleGrowth.map((item, i) => {
                const score = Number(item.score) || 0;
                return (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base leading-none shrink-0">{item.badge || "🎯"}</span>
                        <span className="font-bold text-slate-100 truncate">{item.topic}</span>
                      </div>
                      <span className="text-xs font-black text-amber-400 ml-2 shrink-0">
                        {score}%
                      </span>
                    </div>
                    {/* Horizontal Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-400 h-2 rounded-full transition-all duration-500 ease-out shadow-sm shadow-amber-500/30"
                        style={{ width: `${Math.min(Math.max(score, 5), 100)}%` }}
                        aria-label={`Progress score: ${score}%`}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 font-semibold text-center py-4">
                No weak spots detected right now!
              </p>
            )}
          </div>
        </div>
      </div>

      {data?.ai_recommendation && (
        <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/50 text-xs text-purple-200 flex items-start gap-2.5">
          <span className="font-black text-purple-400 shrink-0">💡 AI Scaffolding Tip:</span>
          <span className="font-medium leading-relaxed">{data.ai_recommendation}</span>
        </div>
      )}
    </Card>
  );
}

