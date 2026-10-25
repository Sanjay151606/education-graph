import React, { useState, useEffect, useRef } from 'react';
import { Timer, Check, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

export const TimedAnswerTask = ({ item, onSubmit }) => {
  const timeLimit = item.time_limit_seconds || 15;
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [selectedOption, setSelectedOption] = useState('');
  const [textInput, setTextInput] = useState('');
  const [startTime, setStartTime] = useState(Date.now());
  const timerRef = useRef(null);
  const submittedRef = useRef(false);

  const handleFinish = (answerToSubmit) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsedMs = Math.max(100, Date.now() - startTime);
    const finalAnswer = (answerToSubmit !== undefined ? answerToSubmit : selectedOption || textInput).trim();

    onSubmit({
      item_id: item.id,
      user_answer_text: finalAnswer,
      response_time_ms: elapsedMs
    });
  };

  useEffect(() => {
    submittedRef.current = false;
    setStartTime(Date.now());
    setTimeLeft(timeLimit);
    setSelectedOption('');
    setTextInput('');

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinish(''); // auto-submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [item.id, timeLimit]);

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    handleFinish(option);
  };

  const progressPercent = (timeLeft / timeLimit) * 100;

  return (
    <div className="glass-panel-glow rounded-3xl p-6 sm:p-10 space-y-8 max-w-2xl mx-auto animate-float">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-focus-400">
          <Timer className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Processing Speed & Rapid Decision
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
            timeLeft <= 5 ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 animate-ping' : 'bg-slate-900 text-slate-300 border-slate-800'
          }`}>
            {timeLeft}s remaining
          </span>
          <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
            item.difficulty === 'hard'
              ? 'bg-rose-950/60 text-rose-300 border-rose-500/30'
              : item.difficulty === 'medium'
              ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
              : 'bg-focus-950/60 text-focus-300 border-focus-500/30'
          }`}>
            {item.difficulty}
          </span>
        </div>
      </div>

      {/* Countdown Progress Bar */}
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            timeLeft <= 4 ? 'bg-rose-500' : 'bg-gradient-to-r from-brain-500 to-focus-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Prompt Question */}
      <div className="space-y-2">
        <h2 className="text-lg sm:text-2xl font-extrabold text-white leading-relaxed">
          {item.prompt_text}
        </h2>
      </div>

      {/* Choices / Input Area */}
      {item.options && item.options.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {item.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionClick(option)}
              className={`p-4 rounded-2xl text-left font-bold text-sm border transition-all duration-150 flex items-center justify-between group ${
                selectedOption === option
                  ? 'bg-focus-600/30 border-focus-500 text-focus-100 shadow-md'
                  : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 text-slate-200 hover:border-brain-500/50 hover:scale-[1.01]'
              }`}
            >
              <span>{option}</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-focus-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          <input
            type="text"
            placeholder="Type your answer here..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && textInput.trim()) {
                handleFinish(textInput);
              }
            }}
            autoFocus
            className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-focus-500"
          />

          <div className="flex justify-end">
            <button
              onClick={() => handleFinish(textInput)}
              disabled={!textInput.trim()}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-focus-600 hover:bg-focus-500 text-white font-bold text-sm shadow-lg shadow-focus-900/40 hover:scale-105 transition-all disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              <span>Submit Answer</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
