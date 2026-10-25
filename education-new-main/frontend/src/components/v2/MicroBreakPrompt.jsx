import { useState, useEffect } from "react";

export default function MicroBreakPrompt({ isOpen, onClose }) {
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [breathPhase, setBreathPhase] = useState("Breathe in"); // "Breathe in" | "Hold" | "Breathe out"

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(60);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const breathCycle = setInterval(() => {
      setBreathPhase((current) => {
        if (current === "Breathe in") return "Hold";
        if (current === "Hold") return "Breathe out";
        return "Breathe in";
      });
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(breathCycle);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-indigo-100 p-5 space-y-4 animate-bounce-short">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
            🧘
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900">Quick 60s Micro-Break</h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-100 text-indigo-700">
                Private Nudge
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Unclench your jaw, roll your shoulders</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
        >
          ✕
        </button>
      </div>

      {/* Breathing Bubble Animation */}
      <div className="flex flex-col items-center justify-center py-2 space-y-2">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-3000 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border-2 border-indigo-400/50 ${
            breathPhase === "Breathe in"
              ? "scale-125 bg-indigo-500/30"
              : breathPhase === "Hold"
              ? "scale-125 bg-purple-500/30"
              : "scale-90 bg-indigo-500/10"
          }`}
        >
          <span className="text-xs font-bold text-indigo-900">{breathPhase}</span>
        </div>
        <div className="text-xs font-medium text-slate-600">
          {secondsRemaining > 0 ? `${secondsRemaining}s remaining` : "Great job resetting!"}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm"
        >
          {secondsRemaining === 0 ? "Return to Lecture" : "I'm Ready"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition"
        >
          Snooze 5m
        </button>
      </div>

      <p className="text-[10px] text-slate-400 text-center italic">
        🔒 This prompt is private to you and never visible to the teacher or classmates.
      </p>
    </div>
  );
}
