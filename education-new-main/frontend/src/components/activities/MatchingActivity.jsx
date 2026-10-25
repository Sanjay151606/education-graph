import React, { useState, useEffect } from "react";
import { Check, AlertCircle, RefreshCw, Sparkles, Award } from "lucide-react";
import Card from "../common/Card";

export default function MatchingActivity({ activity, onComplete }) {
  const pairs = activity?.content?.pairs || [];
  
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [selectedDef, setSelectedDef] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState({}); // { [termId]: defId }
  const [shuffledDefs, setShuffledDefs] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Shuffle definitions independently
    const defs = pairs.map((p) => ({ id: p.id, definition: p.definition }));
    setShuffledDefs([...defs].sort(() => Math.random() - 0.5));
    setMatchedPairs({});
    setSelectedTerm(null);
    setSelectedDef(null);
    setAttempts(0);
    setIsDone(false);
  }, [activity]);

  const handleTermClick = (pair) => {
    if (matchedPairs[pair.id]) return; // already matched
    setSelectedTerm(pair.id);

    if (selectedDef) {
      checkMatch(pair.id, selectedDef);
    }
  };

  const handleDefClick = (def) => {
    // check if this def is already matched
    const isAlreadyMatched = Object.values(matchedPairs).includes(def.id);
    if (isAlreadyMatched) return;

    setSelectedDef(def.id);

    if (selectedTerm) {
      checkMatch(selectedTerm, def.id);
    }
  };

  const checkMatch = (termId, defId) => {
    setAttempts((prev) => prev + 1);
    if (termId === defId) {
      const updated = { ...matchedPairs, [termId]: defId };
      setMatchedPairs(updated);
      setSelectedTerm(null);
      setSelectedDef(null);

      if (Object.keys(updated).length === pairs.length) {
        setIsDone(true);
        const calculatedScore = Math.max(70, 100 - (attempts - pairs.length) * 5);
        onComplete?.(calculatedScore, { matches: updated, attempts: attempts + 1 });
      }
    } else {
      // Mismatch
      setTimeout(() => {
        setSelectedTerm(null);
        setSelectedDef(null);
      }, 500);
    }
  };

  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-black text-slate-900">{activity?.title || "Concept Matching Challenge"}</h3>
          <p className="text-xs text-slate-500">
            Click a term on the left, then click its corresponding definition on the right.
          </p>
        </div>
        <span className="px-3 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
          Matched: {Object.keys(matchedPairs).length} / {pairs.length}
        </span>
      </div>

      {isDone ? (
        <div className="text-center py-8 space-y-4 animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto border border-emerald-200 shadow-sm">
            🎉
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900">All Terms Successfully Matched!</h4>
            <p className="text-xs text-slate-500 mt-1">
              Neural pathways reinforced. Your mastery score has been recorded.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Terms Column */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase text-slate-400">Key Terms</span>
            <div className="space-y-2">
              {pairs.map((p) => {
                const isMatched = !!matchedPairs[p.id];
                const isSelected = selectedTerm === p.id;

                let style = "bg-white border-slate-200 text-slate-800 hover:border-purple-300";
                if (isSelected) style = "bg-purple-50 border-purple-500 text-purple-900 font-black ring-2 ring-purple-500/20";
                if (isMatched) style = "bg-emerald-50 border-emerald-300 text-emerald-800 opacity-60 cursor-default";

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isMatched}
                    onClick={() => handleTermClick(p)}
                    className={`w-full p-3.5 rounded-2xl border text-left text-xs font-bold transition cursor-pointer flex items-center justify-between ${style}`}
                  >
                    <span>{p.term}</span>
                    {isMatched && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Definitions Column */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase text-slate-400">Definitions</span>
            <div className="space-y-2">
              {shuffledDefs.map((d) => {
                const isMatched = Object.values(matchedPairs).includes(d.id);
                const isSelected = selectedDef === d.id;

                let style = "bg-white border-slate-200 text-slate-700 hover:border-indigo-300";
                if (isSelected) style = "bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-500/20";
                if (isMatched) style = "bg-emerald-50 border-emerald-300 text-emerald-800 opacity-60 cursor-default";

                return (
                  <button
                    key={d.id}
                    type="button"
                    disabled={isMatched}
                    onClick={() => handleDefClick(d)}
                    className={`w-full p-3.5 rounded-2xl border text-left text-xs leading-relaxed transition cursor-pointer flex items-center justify-between ${style}`}
                  >
                    <span>{d.definition}</span>
                    {isMatched && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
