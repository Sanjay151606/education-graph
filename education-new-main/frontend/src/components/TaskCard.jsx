import React from "react";
import { CheckCircle2, Clock, ListOrdered, Sparkles } from "lucide-react";

export default function TaskCard({ task, onStatusChange }) {
  const priorityConfig = {
    high: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      badge: "High Priority",
    },
    medium: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      badge: "Medium Priority",
    },
    low: {
      bg: "bg-slate-50",
      text: "text-slate-600",
      border: "border-slate-200",
      badge: "Low Priority",
    },
  }[task.priority] || {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    badge: "Normal",
  };

  const isDone = task.status === "done";

  return (
    <div
      className={`rounded-3xl p-5 border transition-all shadow-sm ${
        isDone
          ? "bg-slate-50/70 border-slate-200/60 opacity-80"
          : "bg-white border-slate-200/90 hover:border-brain-300 hover:shadow-md"
      }`}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="space-y-1">
          <h3
            className={`font-bold text-sm text-slate-900 ${
              isDone ? "line-through text-slate-400" : ""
            }`}
          >
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-slate-500 leading-relaxed">{task.description}</p>
          )}
        </div>

        <span
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}
        >
          {priorityConfig.badge}
        </span>
      </div>

      {task.subtasks?.length > 0 && (
        <div className="mt-4 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-2">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>AI Chunked Micro-Steps:</span>
          </div>
          <ul className="space-y-1.5">
            {task.subtasks.map((s, i) => (
              <li key={i} className="text-xs flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brain-500" />
                  <span>{s.step}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  ~{s.estimated_minutes}m
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">Status:</span>
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-brain-500 cursor-pointer shadow-2xs"
        >
          <option value="pending">⏳ Pending</option>
          <option value="in_progress">⚡ In Progress</option>
          <option value="done">✅ Done (Auto-Report)</option>
        </select>
      </div>
    </div>
  );
}
