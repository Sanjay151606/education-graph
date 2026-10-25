import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook managing audio recording via MediaRecorder.
 * Handles microphone permissions, stream teardown, and blob assembly.
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setIsRecording(false);

        // Teardown tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      return true;
    } catch (err) {
      console.error('Error starting audio recording:', err);
      setError(err.message || 'Microphone access denied or unavailable.');
      setIsRecording(false);
      return false;
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.addEventListener(
          'stop',
          () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            resolve(blob);
          },
          { once: true }
        );
        mediaRecorderRef.current.stop();
      } else {
        resolve(null);
      }
    });
  }, []);

  const clearAudio = useCallback(() => {
    setAudioBlob(null);
    audioChunksRef.current = [];
    setError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  return {
    isRecording,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    clearAudio,
  };
}
