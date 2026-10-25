import React, { useState, useEffect } from "react";
import api from "../../api/client";
import { Sparkles, Users, Award, BookOpen, CheckCircle, HelpCircle, RefreshCw } from "lucide-react";
import Card from "../common/Card";

export default function TeacherClassInsightsCard({ topic = "Cellular Respiration & Energy Pathways" }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInsights() {
      setLoading(true);
      try {
        const res = await api.get(`/api/ai/teacher-insights?topic=${encodeURIComponent(topic)}`);
        setData(res.data);
      } catch (err) {
        console.warn("Could not load teacher insights:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, [topic]);

  if (loading) {
    return (
      <Card className="animate-pulse space-y-3">
        <div className="h-4 bg-slate-200 rounded-md w-1/3" />
        <div className="h-24 bg-slate-100 rounded-2xl w-full" />
      </Card>
    );
  }

  const dist = data?.band_distribution || { foundation: 14, on_track: 32, advanced: 14 };
  const total = data?.total_students || 60;

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/60">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-black text-slate-900">AI Pre-Lesson Class Insights</h3>
            <p className="text-[11px] font-semibold text-slate-400">
              Aggregated knowledge cluster briefing for {data?.topic || topic}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
          {total} Students Enrolled
        </span>
      </div>

      {/* Band distribution summary pills */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-0.5">
          <div className="text-base font-black text-amber-900">{dist.foundation}</div>
          <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
            🥉 Foundation ({Math.round((dist.foundation / total) * 100)}%)
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-0.5">
          <div className="text-base font-black text-emerald-900">{dist.on_track}</div>
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
            🥈 On Track ({Math.round((dist.on_track / total) * 100)}%)
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-center space-y-0.5">
          <div className="text-base font-black text-purple-900">{dist.advanced}</div>
          <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
            🥇 Advanced ({Math.round((dist.advanced / total) * 100)}%)
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
        {data?.executive_summary}
      </div>

      {/* Recommended Lesson Plan Steps */}
      {data?.recommended_lesson_plan && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-800">
            🎯 Suggested Instructional Pathway:
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {data.recommended_lesson_plan.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
