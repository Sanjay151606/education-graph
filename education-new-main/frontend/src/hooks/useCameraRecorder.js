/**
 * useCameraRecorder.js
 *
 * Privacy-first student camera recording hook.
 * - Manages MediaRecorder with 10-second chunking (video/webm).
 * - Audio is NEVER recorded (audio: false).
 * - Chunks are uploaded incrementally to FastAPI -> private Supabase Storage.
 * - Provides live timer (MM:SS) and full lifecycle management.
 */

import { useState, useRef, useCallback } from "react";
import v2Api from "../services/v2_api";

export function useCameraRecorder({ sessionId, mediaStream, onRecordingCompleted }) {
  const [recordingState, setRecordingState] = useState("idle"); // idle | consent_needed | starting | recording | stopping | completed | error
  const [recordingId, setRecordingId] = useState(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunkIndexRef = useRef(0);
  const recordingIdRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Pick supported MIME type
  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === "undefined") return "";
    const types = [
      "video/webm;codecs=vp8",
      "video/webm;codecs=vp9",
      "video/webm",
      "video/mp4",
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return "";
  };

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // 1. Show Consent Dialog
  const requestStartRecording = useCallback(() => {
    if (!mediaStream || mediaStream.getVideoTracks().length === 0) {
      setErrorMessage("Please enable your camera before starting recording.");
      setRecordingState("error");
      return;
    }
    setErrorMessage("");
    setRecordingState("consent_needed");
  }, [mediaStream]);

  const cancelConsent = useCallback(() => {
    setRecordingState("idle");
    setErrorMessage("");
  }, []);

  // 2. Begin Recording after Consent
  const confirmConsentAndStart = useCallback(async () => {
    if (!mediaStream || mediaStream.getVideoTracks().length === 0) {
      setErrorMessage("Camera stream is not active. Please enable camera first.");
      setRecordingState("error");
      return;
    }

    try {
      setRecordingState("starting");
      setErrorMessage("");
      chunkIndexRef.current = 0;

      console.log(`[CameraRecorder] Starting server recording for session: ${sessionId}`);

      // Register recording in backend with authentication token
      const res = await v2Api.startRecording(sessionId || "live-focus-session");
      const recId = res.recording_id;
      setRecordingId(recId);
      recordingIdRef.current = recId;

      console.log(`[CameraRecorder] Server recording started with ID: ${recId}`);

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(mediaStream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0 && recordingIdRef.current) {
          const currentChunkIdx = chunkIndexRef.current;
          chunkIndexRef.current += 1;
          try {
            console.log(`[CameraRecorder] Uploading chunk ${currentChunkIdx} (${event.data.size} bytes)...`);
            await v2Api.uploadRecordingChunk(recordingIdRef.current, currentChunkIdx, event.data);
          } catch (err) {
            console.warn(`[CameraRecorder] Chunk ${currentChunkIdx} upload failed:`, err);
          }
        }
      };

      recorder.onerror = (e) => {
        console.error("[CameraRecorder] Recorder error:", e);
        setErrorMessage("MediaRecorder encountered an unexpected recording error.");
        setRecordingState("error");
      };

      // 10-second chunking
      recorder.start(10000);
      startTimeRef.current = Date.now();
      setDurationSeconds(0);
      setRecordingState("recording");

      // Start duration timer
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDurationSeconds(elapsed);
      }, 1000);
    } catch (err) {
      console.error("[CameraRecorder] Start recording failed:", err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Could not start recording session on server.";
      setErrorMessage(detail);
      setRecordingState("error");
    }
  }, [sessionId, mediaStream]);

  // 3. Stop Recording
  const stopRecording = useCallback(async () => {
    if (recordingState !== "recording" || !mediaRecorderRef.current) return;

    setRecordingState("stopping");
    clearInterval(timerIntervalRef.current);
    const finalDuration = durationSeconds || Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }

    // Wait 600ms for final ondataavailable event to fire
    await new Promise((r) => setTimeout(r, 600));

    if (recordingIdRef.current) {
      try {
        console.log(`[CameraRecorder] Finalizing recording ${recordingIdRef.current} with duration: ${finalDuration}s`);
        await v2Api.completeRecording(recordingIdRef.current, finalDuration);
        setRecordingState("completed");
        if (onRecordingCompleted) {
          onRecordingCompleted({
            recordingId: recordingIdRef.current,
            durationSeconds: finalDuration,
          });
        }
      } catch (err) {
        console.warn("[CameraRecorder] Failed to complete recording metadata:", err);
        setRecordingState("completed"); // Still allow student to view summary
      }
    } else {
      setRecordingState("idle");
    }
  }, [recordingState, durationSeconds, onRecordingCompleted]);

  const resetRecording = useCallback(() => {
    setRecordingState("idle");
    setRecordingId(null);
    recordingIdRef.current = null;
    setDurationSeconds(0);
    setErrorMessage("");
  }, []);

  return {
    recordingState,
    recordingId,
    durationSeconds,
    formattedTime: formatTime(durationSeconds),
    errorMessage,
    requestStartRecording,
    confirmConsentAndStart,
    cancelConsent,
    stopRecording,
    resetRecording,
  };
}
