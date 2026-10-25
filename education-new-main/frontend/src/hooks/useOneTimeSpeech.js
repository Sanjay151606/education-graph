import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook wrapping SpeechSynthesis with a strict one-time play lock per item/passage.
 */
export function useOneTimeSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const utteranceRef = useRef(null);

  const speak = useCallback((text, options = {}, onEndCallback = null) => {
    if (hasPlayed || isPlaying || !text) return false;
    if (!('speechSynthesis' in window)) {
      console.warn('Web Speech API is not supported in this browser.');
      setHasPlayed(true);
      if (onEndCallback) onEndCallback();
      return false;
    }

    window.speechSynthesis.cancel(); // Cancel any lingering utterances

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 0.92;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setHasPlayed(true);
      if (onEndCallback) {
        onEndCallback();
      }
    };

    utterance.onerror = (e) => {
      console.error('SpeechSynthesis error:', e);
      setIsPlaying(false);
      setHasPlayed(true);
      if (onEndCallback) {
        onEndCallback();
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  }, [hasPlayed, isPlaying]);

  const resetForNewItem = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setHasPlayed(false);
  }, []);

  const cancel = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isPlaying,
    hasPlayed,
    speak,
    resetForNewItem,
    cancel,
  };
}
