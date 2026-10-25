import React, { useState, useEffect, useRef } from "react";
import { Clock, Check, AlertCircle, ArrowRight, Award } from "lucide-react";
import Card from "../common/Card";
import { useStimulationMode } from "../v2/ReducedStimulationMode";

export default function MiniChallenge({ activity, onComplete }) {
  const { reducedStimulation } = useStimulationMode();

  const content = activity?.content || {};
  const initialSeconds = content.time_limit_seconds || 120;
  const questions = content.questions || [];

  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
    if (isCompleted) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinish(selectedAnswers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isCompleted, selectedAnswers]);

  const currentQ = questions[currentIdx];

  const handleSelectOption = (opt) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: opt }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      handleFinish(selectedAnswers);
    }
  };

  const handleFinish = (answers) => {
    clearInterval(timerRef.current);
    setIsCompleted(true);

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correct) {
        correctCount += 1;
      }
    });

    const calculatedScore = Math.round((correctCount / Math.max(questions.length, 1)) * 100);
    setScore(calculatedScore);
    onComplete?.(calculatedScore, { answers, correctCount, timeSpent: initialSeconds - secondsLeft });
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <Card className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-black text-slate-900">{activity?.title || "Timed Mini-Challenge"}</h3>
          <p className="text-xs text-slate-500">Low-pressure micro-challenge to test recall under focused pacing.</p>
        </div>

        {/* Calm countdown badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
            reducedStimulation
              ? "bg-slate-100 border-slate-300 text-slate-700"
              : "bg-indigo-50 border-indigo-200 text-indigo-700"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{mm}:{ss}</span>
        </div>
      </div>

      {isCompleted ? (
        <div className="text-center py-8 space-y-4 animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto border border-emerald-200 shadow-sm">
            🏆
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900">Mini-Challenge Complete!</h4>
            <p className="text-xs text-slate-500 mt-1">
              You scored <span className="font-bold text-emerald-600">{score}%</span> under focused sprint conditions.
            </p>
          </div>
        </div>
      ) : currentQ ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>Question {currentIdx + 1} of {questions.length}</span>
            <span>Sprint in progress</span>
          </div>

          <p className="text-sm font-bold text-slate-900 leading-snug">
            {currentQ.question}
          </p>

          <div className="space-y-2 pt-1">
            {currentQ.options.map((opt, oIdx) => {
              const isSelected = selectedAnswers[currentIdx] === opt;
              return (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full p-3 rounded-2xl border text-left text-xs font-medium transition cursor-pointer flex items-center gap-2.5 ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-400 text-indigo-900 font-bold ring-2 ring-indigo-500/10"
                      : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200"
                  }`}
                >
                  <span className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={!selectedAnswers[currentIdx]}
              onClick={handleNext}
              className="px-6 py-2.5 rounded-2xl bg-brain-600 hover:bg-brain-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <span>{currentIdx < questions.length - 1 ? "Next Question" : "Submit Challenge"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
