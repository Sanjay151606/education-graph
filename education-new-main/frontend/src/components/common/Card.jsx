import React from "react";

/**
 * Shared Card Component for BrainGraph
 * Consistent spacing, design tokens, left-border accents, smooth hover lift on desktop,
 * tap compression on touch devices, and reduced-motion / calm mode awareness.
 */
export default function Card({
  children,
  className = "",
  variant = "default", // default | glass | flat | interactive | elevated
  padding = "default", // default (p-5 sm:p-6) | sm (p-4) | lg (p-6 sm:p-8) | none
  accent, // indigo | emerald | amber | purple | pink | teal | tasks | materials | focus | live | reports
  interactive = false, // explicitly enable interactive lift/press if not using variant="interactive"
  onClick,
  ...props
}) {
  const paddingClasses =
    {
      default: "p-4 sm:p-6",
      sm: "p-3 sm:p-4",
      lg: "p-5 sm:p-8",
      none: "p-0",
    }[padding] || "p-4 sm:p-6";

  const accentClasses = {
    indigo: "border-l-4 border-l-indigo-500",
    tasks: "border-l-4 border-l-tasks",
    blue: "border-l-4 border-l-indigo-500",
    emerald: "border-l-4 border-l-emerald-500",
    materials: "border-l-4 border-l-materials",
    green: "border-l-4 border-l-emerald-500",
    amber: "border-l-4 border-l-amber-500",
    focus: "border-l-4 border-l-focusMode",
    orange: "border-l-4 border-l-amber-500",
    purple: "border-l-4 border-l-purple-500",
    live: "border-l-4 border-l-liveClass",
    pink: "border-l-4 border-l-pink-500",
    reports: "border-l-4 border-l-reports",
    teal: "border-l-4 border-l-teal-500",
  }[accent] || "";

  const variantClasses =
    {
      default:
        "bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 text-slate-100 shadow-xl hover:shadow-indigo-500/10 hover:border-slate-700/90 hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200",
      glass:
        "bg-slate-900/65 backdrop-blur-2xl border border-indigo-500/20 text-slate-100 shadow-2xl hover:border-indigo-500/40 hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200",
      flat: "bg-slate-900/50 border border-slate-800/80 text-slate-200",
      interactive:
        "bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-indigo-400/70 hover:shadow-indigo-500/15 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 cursor-pointer text-slate-100",
      elevated:
        "bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 text-slate-100",
    }[variant] ||
    "bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 text-slate-100 shadow-xl hover:shadow-indigo-500/10 hover:border-slate-700/90 hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200";

  const isClickable = Boolean(onClick || interactive || variant === "interactive");

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl sm:rounded-3xl ${variantClasses} ${accentClasses} ${paddingClasses} ${
        isClickable ? "cursor-pointer" : ""
      } motion-reduce:transform-none motion-reduce:transition-none ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

