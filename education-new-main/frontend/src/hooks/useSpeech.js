import { useState, useEffect, useRef, useCallback } from 'react';

export const useSpeech = () => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState(null);

  const recognitionRef = useRef(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);

  const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const isRecognitionSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize SpeechRecognition instance
  useEffect(() => {
    if (!isRecognitionSupported) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript.trim());
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error !== 'no-speech') {
          setSpeechError(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Could not initialize SpeechRecognition:', err);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [isRecognitionSupported]);

  // Speak aloud via Text-to-Speech
  const speak = useCallback(
    (text) => {
      return new Promise((resolve) => {
        if (!isSpeechSupported || !synthRef.current) {
          console.warn('Speech synthesis not supported on this browser.');
          resolve();
          return;
        }

        try {
          synthRef.current.cancel(); // Stop any currently playing audio
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.95; // slightly relaxed pace for ADHD comprehension
          utterance.pitch = 1.0;
          utterance.lang = 'en-US';

          utterance.onstart = () => {
            setIsSpeaking(true);
          };

          utterance.onend = () => {
            setIsSpeaking(false);
            resolve();
          };

          utterance.onerror = (e) => {
            console.warn('Speech synthesis error:', e);
            setIsSpeaking(false);
            resolve();
          };

          synthRef.current.speak(utterance);
        } catch (err) {
          console.warn('Error during speak invocation:', err);
          setIsSpeaking(false);
          resolve();
        }
      });
    },
    [isSpeechSupported]
  );

  // Start capturing voice
  const startListening = useCallback(() => {
    setTranscript('');
    setSpeechError(null);
    if (!recognitionRef.current) {
      setSpeechError('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.warn('Speech recognition start failed or already active:', err);
    }
  }, []);

  // Stop capturing voice
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript,
    setTranscript,
    isListening,
    isSpeaking,
    isSpeechSupported,
    isRecognitionSupported,
    speechError,
    speak,
    startListening,
    stopListening,
    resetTranscript,
  };
};
