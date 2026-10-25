import { useState } from "react";

export default function BandedMaterialViewer({ material }) {
  const [flippedCards, setFlippedCards] = useState({});

  if (!material) return null;

  const bandConfig = {
    foundation: {
      label: "Foundation Band",
      desc: "Step-by-step sequential pacing with simplified language & visual anchors.",
      badge: "bg-blue-50 text-blue-700 border-blue-200",
      accent: "border-l-4 border-l-blue-500",
      icon: "🌱",
    },
    "on-track": {
      label: "On-Track Band",
      desc: "Balanced conceptual summaries with high-impact key takeaways & active recall.",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      accent: "border-l-4 border-l-emerald-500",
      icon: "⚡",
    },
    advanced: {
      label: "Advanced Band",
      desc: "Analytical synthesis, mechanism deep-dives, and higher-order extension questions.",
      badge: "bg-purple-50 text-purple-700 border-purple-200",
      accent: "border-l-4 border-l-purple-500",
      icon: "🚀",
    },
  };

  const cfg = bandConfig[material.band] || bandConfig["on-track"];

  const toggleFlip = (index) => {
    setFlippedCards((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="space-y-6">
      {/* Band Badge Banner */}
      <div className={`p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm ${cfg.accent} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{cfg.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.badge}`}>
                {cfg.label}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Pacing Level: {material.depth_level || "Calibrated"}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">{cfg.desc}</p>
          </div>
        </div>
      </div>

      {/* Simplified / Band-calibrated content */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span>📚</span>
          <span>Calibrated Study Material</span>
        </h3>

        <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
          {material.simplified_text}
        </div>
      </div>

      {/* Key Takeaways */}
      {material.summary_bullets && material.summary_bullets.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>💡</span>
            <span>Key Takeaways ({material.band.toUpperCase()})</span>
          </h3>
          <ul className="space-y-2">
            {material.summary_bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                <span className="text-brain-500 font-bold mt-0.5">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Flashcards */}
      {material.flashcards && material.flashcards.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>🃏</span>
            <span>Active Recall Flashcards ({material.flashcards.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {material.flashcards.map((card, idx) => {
              const isFlipped = !!flippedCards[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleFlip(idx)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 min-h-28 flex flex-col justify-between ${
                    isFlipped
                      ? "bg-brain-50 border-brain-300 text-brain-950 shadow-xs"
                      : "bg-white border-slate-200/80 hover:border-slate-300 text-slate-800"
                  }`}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {isFlipped ? "Answer" : "Question (Click to flip)"}
                  </div>
                  <div className="text-xs font-medium my-2">
                    {isFlipped ? (card.a || card.answer) : (card.q || card.question)}
                  </div>
                  <div className="text-[10px] text-right text-brain-600 font-medium">
                    {isFlipped ? "↩ Click to question" : "👉 Reveal answer"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Challenge Questions (for Advanced Band) */}
      {material.challenge_questions && material.challenge_questions.length > 0 && (
        <div className="bg-purple-50/60 rounded-3xl border border-purple-200 shadow-sm p-6 space-y-3">
          <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
            <span>🚀</span>
            <span>Advanced Extension Challenges</span>
          </h3>
          <ul className="space-y-2">
            {material.challenge_questions.map((q, idx) => (
              <li key={idx} className="p-3 bg-white rounded-xl border border-purple-100 text-xs text-purple-900 font-medium">
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
