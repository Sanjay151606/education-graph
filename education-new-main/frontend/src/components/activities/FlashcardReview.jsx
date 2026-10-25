import React, { useState } from "react";
import { RotateCw, CheckCircle, HelpCircle, ArrowRight, Sparkles, Award } from "lucide-react";
import Card from "../common/Card";

export default function FlashcardReview({ activity, onComplete }) {
  const cards = activity?.content?.cards || [];
  
  const [deck, setDeck] = useState(cards);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentCard = deck[currentIdx];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleResponse = (isMastered) => {
    setIsFlipped(false);
    if (isMastered) {
      setMasteredCount((prev) => prev + 1);
    } else {
      setReviewCount((prev) => prev + 1);
      // Re-queue this card at the end of the deck for spaced repetition reinforcement
      if (currentCard) {
        setDeck((prev) => [...prev, currentCard]);
      }
    }

    if (currentIdx < deck.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      const calculatedScore = Math.min(100, Math.round(((masteredCount + (isMastered ? 1 : 0)) / Math.max(cards.length, 1)) * 100));
      onComplete?.(calculatedScore, { mastered: masteredCount + (isMastered ? 1 : 0), deckLength: cards.length });
    }
  };

  const handleRestart = () => {
    setDeck(cards);
    setCurrentIdx(0);
    setIsFlipped(false);
    setMasteredCount(0);
    setReviewCount(0);
    setIsCompleted(false);
  };

  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-black text-slate-900">{activity?.title || "Spaced Repetition Flashcards"}</h3>
          <p className="text-xs text-slate-500">Tap the card to reveal the explanation, then rate your recall confidence.</p>
        </div>
        <span className="px-3 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
          Card {Math.min(currentIdx + 1, deck.length)} of {deck.length}
        </span>
      </div>

      {isCompleted ? (
        <div className="text-center py-8 space-y-4 animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center text-3xl mx-auto border border-purple-200 shadow-sm">
            🏆
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900">Deck Review Finished!</h4>
            <p className="text-xs text-slate-500 mt-1">
              You reviewed {cards.length} cards with spaced-repetition reinforcement.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRestart}
            className="px-4 py-2 rounded-xl bg-brain-50 text-brain-700 text-xs font-bold hover:bg-brain-100 transition cursor-pointer"
          >
            Review Deck Again
          </button>
        </div>
      ) : currentCard ? (
        <div className="space-y-5">
          {/* 3D-feel Flashcard */}
          <div
            onClick={handleFlip}
            className="min-h-56 p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{isFlipped ? "Answer & Concept:" : "Prompt / Question:"}</span>
              </span>
              <span className="flex items-center gap-1 text-slate-400 hover:text-white">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Click to flip</span>
              </span>
            </div>

            <div className="py-6 text-center">
              <p className="text-base sm:text-lg font-bold leading-relaxed">
                {isFlipped ? currentCard.back : currentCard.front}
              </p>
              {isFlipped && currentCard.hint && (
                <p className="text-xs text-indigo-200/80 mt-3 italic">
                  💡 Hint: {currentCard.hint}
                </p>
              )}
            </div>

            <div className="text-center text-[10px] text-slate-400 font-semibold">
              {isFlipped ? "Rate your recall below to schedule spaced repetition" : "Think of the key term, then flip"}
            </div>
          </div>

          {/* Self-Assessment Buttons */}
          {isFlipped && (
            <div className="grid grid-cols-2 gap-3 pt-2 animate-in fade-in">
              <button
                type="button"
                onClick={() => handleResponse(false)}
                className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>🔄 Still Learning (Repeat later)</span>
              </button>

              <button
                type="button"
                onClick={() => handleResponse(true)}
                className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>✅ Got It! (Mastered)</span>
              </button>
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
}
