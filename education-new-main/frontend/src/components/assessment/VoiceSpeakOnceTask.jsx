import React, { useState, useEffect, useRef } from 'react';
import { useSpeech } from '../../hooks/useSpeech';
import { Volume2, VolumeX, Mic, MicOff, Check, AlertCircle, Headphones, Sparkles } from 'lucide-react';

export const VoiceSpeakOnceTask = ({ item, onSubmit }) => {
  const {
    transcript,
    setTranscript,
    isListening,
    isSpeaking,
    isRecognitionSupported,
    speak,
    startListening,
    stopListening
  } = useSpeech();

  const [hasPlayed, setHasPlayed] = useState(false);
  const [audioFinished, setAudioFinished] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    setStartTime(Date.now());
    setHasPlayed(false);
    setAudioFinished(false);
    setTranscript('');
  }, [item.id, setTranscript]);

  const handlePlayAudio = async () => {
    if (hasPlayed) return;
    setHasPlayed(true);
    await speak(item.prompt_text);
    setAudioFinished(true);
  };

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

  return (
    <div className="glass-panel-glow rounded-3xl p-6 sm:p-10 space-y-8 max-w-2xl mx-auto animate-float">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-brain-400">
          <Headphones className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Auditory Working Memory (One-Time Listen)
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

      {/* Central Audio Play Interaction */}
      <div className="text-center space-y-4 py-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
          ⚠️ **Rules:** You can only play the audio <span className="text-brain-400 font-bold">once</span>. Listen closely, then speak back what you heard!
        </div>

        <button
          onClick={handlePlayAudio}
          disabled={hasPlayed}
          className={`px-8 py-5 rounded-3xl font-extrabold text-base flex items-center justify-center gap-3 mx-auto shadow-xl transition-all duration-300 ${
            !hasPlayed
              ? 'bg-gradient-to-r from-brain-600 to-indigo-600 hover:from-brain-500 hover:to-indigo-500 text-white shadow-brain-900/50 hover:scale-105 animate-pulse-subtle'
              : 'bg-slate-900/60 border border-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isSpeaking ? (
            <>
              <Volume2 className="w-6 h-6 animate-ping text-brain-300" />
              <span>Playing Audio Prompt...</span>
            </>
          ) : hasPlayed ? (
            <>
              <VolumeX className="w-6 h-6" />
              <span>Audio Played (Locked)</span>
            </>
          ) : (
            <>
              <Volume2 className="w-6 h-6" />
              <span>Play Voice Prompt (1x Only)</span>
            </>
          )}
        </button>
      </div>

      {/* Speech Recording Section (Shown after play or immediately) */}
      <div className="pt-6 border-t border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider">Your Spoken Recall</span>
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
              disabled={!hasPlayed}
              className={`p-4 rounded-full border-2 transition-all flex items-center justify-center ${
                !hasPlayed
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
              {isListening ? 'Listening... Speak now!' : hasPlayed ? 'Tap mic to speak' : 'Listen to audio first'}
            </span>
          </div>
        )}

        {/* Live Transcript / Manual Input */}
        <div className="space-y-1">
          <textarea
            rows={3}
            placeholder={
              hasPlayed
                ? 'Your spoken transcript will appear here (or you can edit/type manually)...'
                : 'Play audio prompt first...'
            }
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            disabled={!hasPlayed}
            className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-brain-500 disabled:opacity-50"
          />
        </div>

        {/* Submit Response */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmit}
            disabled={!hasPlayed || !transcript.trim()}
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
