import React, { useState, useEffect } from "react";
import api from "../../api/client";
import { X, CheckCircle, HelpCircle, ArrowRight, Award, RefreshCw, Sparkles, Check, AlertCircle } from "lucide-react";

export default function PracticeQuizModal({ materialId, topic = "General Biology", band = "on_track", onClose }) {
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    async function loadQuiz() {
      setLoading(true);
      try {
        const res = await api.post("/api/ai/practice-quiz", {
          material_id: materialId,
          topic,
          band,
        });
        setQuizData(res.data);
      } catch (err) {
        console.error("Quiz load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [materialId, topic, band]);

  const questions = quizData?.questions || [];
  const currentQ = questions[currentIdx];

  const handleSelectOption = (opt) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(opt);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || !currentQ) return;
    setIsAnswerSubmitted(true);
    if (selectedOption === currentQ.correct_answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setShowHint(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsCompleted(false);
    setShowHint(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/60">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900">Adaptive Practice Quiz</h3>
              <p className="text-[11px] font-semibold text-slate-500">
                {quizData?.topic || topic} • Band: <span className="capitalize font-bold text-purple-700">{band}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Generating 5 tailored questions for your knowledge band…</p>
            </div>
          ) : isCompleted ? (
            /* Quiz Completed View */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto border border-emerald-200 shadow-sm">
                🏆
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900">Practice Quiz Completed!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  You scored <span className="font-bold text-emerald-600">{score}</span> out of{" "}
                  <span className="font-bold text-slate-800">{questions.length}</span> (
                  {Math.round((score / Math.max(questions.length, 1)) * 100)}%)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {score >= 4
                  ? "Outstanding mastery! Your cognitive model indicates readiness for advanced extension tasks."
                  : "Good effort! Review the explanations below to reinforce key concepts."}
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-brain-600 hover:bg-brain-700 text-white text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          ) : currentQ ? (
            /* Active Question View */
            <div className="space-y-4">
              {/* Question Progress Tracker */}
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span>Score: {score}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question Statement */}
              <p className="text-sm font-bold text-slate-900 leading-snug pt-1">
                {currentQ.question}
              </p>

              {/* Options */}
              <div className="space-y-2 pt-1">
                {currentQ.options.map((opt, oIdx) => {
                  let optStyle = "bg-white border-slate-200 text-slate-700 hover:border-purple-300";
                  if (selectedOption === opt) {
                    optStyle = "bg-purple-50 border-purple-400 text-purple-900 font-bold ring-2 ring-purple-500/10";
                  }
                  if (isAnswerSubmitted) {
                    if (opt === currentQ.correct_answer) {
                      optStyle = "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold";
                    } else if (selectedOption === opt) {
                      optStyle = "bg-rose-50 border-rose-300 text-rose-800 line-through";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full p-3 rounded-2xl border text-left text-xs transition flex items-start gap-2.5 cursor-pointer ${optStyle}`}
                    >
                      <span className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Hint Callout */}
              {currentQ.hint && !isAnswerSubmitted && (
                <div>
                  {!showHint ? (
                    <button
                      type="button"
                      onClick={() => setShowHint(true)}
                      className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Need a hint?</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 animate-in fade-in">
                      💡 <span className="font-bold">Hint:</span> {currentQ.hint}
                    </div>
                  )}
                </div>
              )}

              {/* Instant Explanation upon Submit */}
              {isAnswerSubmitted && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs space-y-1 animate-in fade-in ${
                    selectedOption === currentQ.correct_answer
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {selectedOption === currentQ.correct_answer ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Correct!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Incorrect. Correct answer: {currentQ.correct_answer}</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">{currentQ.explanation}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                {!isAnswerSubmitted ? (
                  <button
                    type="button"
                    disabled={!selectedOption}
                    onClick={handleSubmitAnswer}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="px-5 py-2.5 rounded-xl bg-brain-600 hover:bg-brain-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <span>{currentIdx < questions.length - 1 ? "Next Question" : "View Final Results"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-xs text-slate-500 py-6">No questions available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
