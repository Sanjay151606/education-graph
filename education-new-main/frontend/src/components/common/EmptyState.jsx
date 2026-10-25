import React from "react";

/**
 * Shared EmptyState Component for BrainGraph
 */
export default function EmptyState({
  icon = "📚",
  title = "No Data Found",
  description = "There are no items to display at this moment.",
  actionLabel,
  onAction,
  className = "",
}) {
  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200/80 shadow-sm p-10 sm:p-12 text-center space-y-3 ${className}`}
    >
      <div className="w-14 h-14 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center text-2xl mx-auto border border-slate-100 shadow-xs">
        {typeof icon === "string" ? <span>{icon}</span> : icon}
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAction}
            className="px-4 py-2 rounded-xl bg-brain-50 text-brain-700 text-xs font-bold hover:bg-brain-100 transition cursor-pointer"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
