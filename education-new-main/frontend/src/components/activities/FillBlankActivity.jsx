import React, { useState } from "react";
import { Check, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import Card from "../common/Card";

export default function FillBlankActivity({ activity, onComplete }) {
  const content = activity?.content || {};
  const sentence = content.sentence || "Cells use [ATP] for energy and break down [glucose] during glycolysis.";
  const blanks = content.blanks || ["ATP", "glucose"];
  const wordBank = content.word_bank || ["ATP", "glucose", "ribosome", "lipid", "protein"];

  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [blankIndex]: word }
  const [activeSlot, setActiveSlot] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  // Split sentence around blanks
  const parts = sentence.split(/\[.*?\]/);

  const handleWordSelect = (word) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [activeSlot]: word }));
    if (activeSlot < blanks.length - 1) {
      setActiveSlot((prev) => prev + 1);
    }
  };

  const handleCheck = () => {
    let correctCount = 0;
    blanks.forEach((b, idx) => {
      if (selectedAnswers[idx]?.toLowerCase() === b.toLowerCase()) {
        correctCount += 1;
      }
    });

    const calculatedScore = Math.round((correctCount / Math.max(blanks.length, 1)) * 100);
    setScore(calculatedScore);
    setIsSubmitted(true);
    onComplete?.(calculatedScore, { answers: selectedAnswers, correctCount });
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setActiveSlot(0);
    setIsSubmitted(false);
    setScore(null);
  };

  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-black text-slate-900">{activity?.title || "Fill-in-the-Blank Recap"}</h3>
          <p className="text-xs text-slate-500">Select words from the bank below to complete the core concept.</p>
        </div>
        <span className="px-3 py-1 rounded-xl bg-brain-50 text-brain-700 border border-brain-200 text-xs font-bold">
          {blanks.length} Blanks to Fill
        </span>
      </div>

      {/* Interactive Sentence Container */}
      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-sm sm:text-base leading-loose font-medium text-slate-800">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            <span>{part}</span>
            {i < blanks.length && (
              <button
                type="button"
                onClick={() => !isSubmitted && setActiveSlot(i)}
                className={`inline-flex items-center justify-center min-w-24 px-3 py-1 mx-1.5 rounded-xl border text-xs sm:text-sm font-bold transition cursor-pointer ${
                  selectedAnswers[i]
                    ? isSubmitted
                      ? selectedAnswers[i]?.toLowerCase() === blanks[i]?.toLowerCase()
                        ? "bg-emerald-100 border-emerald-400 text-emerald-900"
                        : "bg-rose-100 border-rose-400 text-rose-900 line-through"
                      : "bg-purple-100 border-purple-400 text-purple-900"
                    : activeSlot === i
                    ? "bg-purple-50 border-purple-500 text-purple-600 border-dashed animate-pulse ring-2 ring-purple-500/20"
                    : "bg-white border-slate-300 text-slate-400 border-dashed"
                }`}
              >
                {selectedAnswers[i] || `[ Blank ${i + 1} ]`}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Word Bank */}
      {!isSubmitted && (
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-black uppercase text-slate-400">Word Bank (Click to fill active blank)</span>
          <div className="flex flex-wrap gap-2">
            {wordBank.map((w, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleWordSelect(w)}
                className="px-4 py-2 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50 text-slate-800 text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions / Results */}
      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
        {isSubmitted ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-800">
              Score: <b className="text-emerald-600 font-black">{score}%</b>
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end w-full gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={Object.keys(selectedAnswers).length < blanks.length}
              onClick={handleCheck}
              className="px-6 py-2.5 rounded-2xl bg-brain-600 hover:bg-brain-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
            >
              Verify Answers
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
