import React, { useState, useEffect, useRef } from 'react';
import { useSpeech } from '../../hooks/useSpeech';
import { Eye, EyeOff, Mic, MicOff, Check, AlertCircle, Clock, Sparkles } from 'lucide-react';

export const ReadSpeakOnceTask = ({ item, onSubmit }) => {
  const {
    transcript,
    setTranscript,
    isListening,
    isRecognitionSupported,
    startListening,
    stopListening
  } = useSpeech();

  const displaySeconds = item.display_seconds || 6;
  const [timeLeft, setTimeLeft] = useState(displaySeconds);
  const [isTextVisible, setIsTextVisible] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    setStartTime(Date.now());
    setTimeLeft(displaySeconds);
    setIsTextVisible(true);
    setTranscript('');

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsTextVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [item.id, displaySeconds, setTranscript]);

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSubmit = () => {
    stopListening();
    const elapsedMs = Math.max(100, Date.now() - startTime);
    onSubmit({
      item_id: item.id,
      user_answer_text: transcript.trim(),
      response_time_ms: elapsedMs
    });
  };

  const progressPercent = (timeLeft / displaySeconds) * 100;

  return (
    <div className="glass-panel-glow rounded-3xl p-6 sm:p-10 space-y-8 max-w-2xl mx-auto animate-float">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400">
          <Eye className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Visual Working Memory (Timed Exposure)
          </span>
        </div>
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

      {/* Visual Text Card / Hidden State */}
      <div className="space-y-4 text-center">
        {isTextVisible ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold font-mono">
              <Clock className="w-4 h-4 animate-spin" />
              <span>Memorize! Disappearing in {timeLeft}s</span>
            </div>

            {/* Shrinking Time Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* The Text to Memorize */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border-2 border-indigo-500/40 text-lg sm:text-2xl font-bold text-white leading-relaxed shadow-lg">
              {item.prompt_text}
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-slate-950/80 border border-slate-800 text-center space-y-2">
            <EyeOff className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-300">Text Hidden</div>
            <p className="text-xs text-slate-500">
              Speak aloud or type everything you recall from the prompt above!
            </p>
          </div>
        )}
      </div>

      {/* Spoken Recall / Mic Section */}
      <div className="pt-6 border-t border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider">Your Recall</span>
          {!isRecognitionSupported && (
            <span className="text-amber-400 flex items-center gap-1 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5" />
              Speech API unavailable — type response below
            </span>
          )}
        </div>

        {/* Live Mic Control */}
        {isRecognitionSupported && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleToggleMic}
              disabled={isTextVisible}
              className={`p-4 rounded-full border-2 transition-all flex items-center justify-center ${
                isTextVisible
                  ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-600'
                  : isListening
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                  : 'bg-focus-500/20 border-focus-500 text-focus-300 hover:scale-105'
              }`}
              title={isListening ? 'Stop Recording' : 'Start Recording'}
            >
              {isListening ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
            </button>
            <span className="text-xs font-semibold text-slate-300">
              {isTextVisible
                ? 'Read and memorize first...'
                : isListening
                ? 'Listening... Speak your recall!'
                : 'Tap mic to speak your recall'}
            </span>
          </div>
        )}

        {/* Live Transcript / Manual Input */}
        <textarea
          rows={3}
          placeholder={
            isTextVisible
              ? 'Text is currently visible, memorize it now...'
              : 'Your spoken transcript will appear here (or type manually)...'
          }
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          disabled={isTextVisible}
          className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-brain-500 disabled:opacity-50"
        />

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmit}
            disabled={isTextVisible || !transcript.trim()}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-focus-600 hover:bg-focus-500 text-white font-bold text-sm shadow-lg shadow-focus-900/40 hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100"
          >
            <Check className="w-4 h-4" />
            <span>Submit Recall</span>
          </button>
        </div>
      </div>
    </div>
  );
};
