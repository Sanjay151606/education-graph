/**
 * CameraPanel.jsx
 *
 * Privacy-first student camera engagement & recording panel.
 *
 * Key features:
 * - Camera is OFF by default (never auto-starts).
 * - Live camera preview with zero black screen (autoPlay, playsInline, muted, verified dimensions).
 * - Real local AI face detection & engagement estimation (no fake 95% confidence on no_face).
 * - Optional video recording with consent dialog, 10s chunking, and upload to private Supabase Storage.
 * - Live WebRTC video sharing with visible "Teacher is viewing your live camera" alert.
 * - Complete Stop Camera & Stop Recording functionality.
 */

import { useCallback, useState } from "react";
import { useCameraEngagement, ENGAGEMENT_STATES } from "../../hooks/useCameraEngagement";
import { useCameraRecorder } from "../../hooks/useCameraRecorder";
import { useWebRTCStream } from "../../hooks/useWebRTCStream";
import { postEngagementEvent } from "../../services/engagementService";

// State display configuration
const STATE_CONFIG = {
  [ENGAGEMENT_STATES.INITIALIZING]: {
    label: "Initializing AI…",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-400 animate-pulse",
    icon: "⚙️",
  },
  [ENGAGEMENT_STATES.WAITING_FOR_CAMERA]: {
    label: "Waiting for Camera…",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400 animate-pulse",
    icon: "⏳",
  },
  [ENGAGEMENT_STATES.FOCUSED]: {
    label: "Focused",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    icon: "🎯",
  },
  [ENGAGEMENT_STATES.POSSIBLY_CONFUSED]: {
    label: "Possibly Confused",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
    icon: "🤔",
  },
  [ENGAGEMENT_STATES.POSSIBLY_DISENGAGED]: {
    label: "Possibly Disengaged",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-400",
    icon: "💭",
  },
  [ENGAGEMENT_STATES.NO_FACE]: {
    label: "No Face Detected",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
    icon: "👤",
  },
  [ENGAGEMENT_STATES.CAMERA_OFF]: {
    label: "Camera Off",
    badge: "bg-slate-100 text-slate-500 border-slate-200",
    dot: "bg-slate-300",
    icon: "📷",
  },
  [ENGAGEMENT_STATES.UNKNOWN]: {
    label: "Estimating…",
    badge: "bg-indigo-50 text-indigo-600 border-indigo-200",
    dot: "bg-indigo-300 animate-pulse",
    icon: "🔍",
  },
};

export default function CameraPanel({ sessionId, userId, wsRef, onStateChange }) {
  const [completedSummary, setCompletedSummary] = useState(null);

  // 1. Local AI Engagement Hook
  const handleEngagementEvent = useCallback(
    (event) => {
      postEngagementEvent(event);
      if (onStateChange) onStateChange(event.state);
    },
    [onStateChange]
  );

  const {
    videoRef,
    mediaStream,
    cameraStatus,
    cameraReady,
    faceDetected,
    engagementState,
    confidence,
    videoDimensions,
    errorMessage: cameraError,
    enableCamera,
    stopCamera,
  } = useCameraEngagement({ sessionId, onEngagementEvent: handleEngagementEvent });

  // 2. Video Recording Hook (10s chunks -> private storage)
  const {
    recordingState,
    formattedTime,
    durationSeconds,
    errorMessage: recorderError,
    requestStartRecording,
    confirmConsentAndStart,
    cancelConsent,
    stopRecording,
    resetRecording,
  } = useCameraRecorder({
    sessionId,
    mediaStream,
    onRecordingCompleted: ({ durationSeconds }) => {
      setCompletedSummary({ durationSeconds });
      stopCamera();
    },
  });

  // 3. WebRTC Live Sharing Hook
  const {
    isLiveSharing,
    teacherViewing,
    startLiveSharing,
    stopLiveSharing,
  } = useWebRTCStream({
    sessionId,
    role: "student",
    userId,
    mediaStream,
    wsRef,
  });

  const cfg = STATE_CONFIG[engagementState] || STATE_CONFIG[ENGAGEMENT_STATES.CAMERA_OFF];
  const isActive = cameraStatus === "active" && cameraReady;
  const isStartingStream = cameraStatus === "active" && !cameraReady;
  const isRequesting = cameraStatus === "requesting";
  const isOff = cameraStatus === "off";
  const isRecording = recordingState === "recording";
  const isStartingRec = recordingState === "starting";
  const isStoppingRec = recordingState === "stopping";
  const isCompleted = recordingState === "completed";
  const hasError = ["denied", "unavailable", "error"].includes(cameraStatus) || recorderError;

  return (
    <div
      className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-4"
      role="region"
      aria-label="Student Camera & AI Engagement"
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🤖</span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">AI Engagement & Camera</h2>
            <p className="text-[10px] text-slate-400">Optional • 100% Local AI • Encrypted storage</p>
          </div>
        </div>

        {/* Camera/Recording status badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${
            isRecording
              ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
              : isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : isStartingStream || isRequesting
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-slate-100 text-slate-500 border-slate-200"
          }`}
          aria-live="polite"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isRecording
                ? "bg-rose-500 animate-ping"
                : isActive
                ? "bg-emerald-500 animate-pulse"
                : isStartingStream || isRequesting
                ? "bg-amber-400 animate-pulse"
                : "bg-slate-300"
            }`}
            aria-hidden="true"
          />
          <span>
            {isRecording
              ? "Recording Active"
              : isActive
              ? "Camera Active"
              : isStartingStream
              ? "Connecting Stream…"
              : isRequesting
              ? "Requesting Access…"
              : cameraStatus === "denied"
              ? "Permission Denied"
              : cameraStatus === "unavailable"
              ? "Camera Unavailable"
              : "Camera Off"}
          </span>
        </div>
      </div>

      {/* ── Teacher Live Viewing Alert ────────────────────────────────────── */}
      {teacherViewing && (
        <div className="p-3 rounded-2xl bg-indigo-500 text-white flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-xl animate-pulse">👩‍🏫</span>
            <div>
              <p className="text-xs font-bold">Teacher is viewing your live camera</p>
              <p className="text-[10px] text-indigo-100">Live 1-on-1 pedagogical review active</p>
            </div>
          </div>
          <button
            type="button"
            onClick={stopLiveSharing}
            className="px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition"
          >
            Stop Sharing
          </button>
        </div>
      )}

      {/* ── OFF / Optional Camera Prompt ──────────────────────────────────── */}
      {isOff && !isCompleted && !hasError && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 text-sm text-slate-700">
          <p className="text-xs text-slate-600 leading-relaxed">
            Camera access is <strong>optional</strong>. When enabled, on-device AI estimates your focus level.
            <strong> Video is processed locally and is never stored unless recording is explicitly started.</strong>
          </p>

          <div className="flex gap-2 flex-wrap">
            <button
              id="btn-enable-camera"
              type="button"
              onClick={enableCamera}
              aria-label="Enable camera for engagement analysis"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brain-600 hover:bg-brain-700 text-white text-xs font-semibold transition shadow-sm shadow-brain-600/20 focus:outline-none focus:ring-2 focus:ring-brain-500 focus:ring-offset-2"
            >
              <span aria-hidden="true">📷</span>
              <span>Enable Camera</span>
            </button>
            <button
              id="btn-continue-without-camera"
              type="button"
              onClick={() => {}}
              aria-label="Continue learning without camera"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              <span>Continue Without Camera</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Permission Requesting State ───────────────────────────────────── */}
      {isRequesting && (
        <div className="flex items-center gap-3 bg-indigo-50 rounded-2xl border border-indigo-100 px-4 py-3">
          <span className="text-xl animate-spin" aria-hidden="true">⏳</span>
          <p className="text-xs text-indigo-800 font-medium">
            Waiting for browser camera permission…
          </p>
        </div>
      )}

      {/* ── Error Display ─────────────────────────────────────────────────── */}
      {hasError && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-3" role="alert">
          <div className="flex items-start gap-2 text-amber-900">
            <span className="text-lg mt-0.5" aria-hidden="true">⚠️</span>
            <div>
              <p className="text-xs leading-relaxed font-semibold">
                {cameraStatus === "denied"
                  ? "Camera Permission Denied"
                  : cameraStatus === "unavailable"
                  ? "Camera Unavailable"
                  : "Camera Notice"}
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                {cameraError || recorderError || "Camera could not be started."}
              </p>
            </div>
          </div>
          <button
            id="btn-retry-camera"
            type="button"
            onClick={enableCamera}
            aria-label="Retry enabling camera"
            className="text-xs text-brain-600 font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-brain-500 rounded"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── Recording Consent Modal ───────────────────────────────────────── */}
      {recordingState === "consent_needed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl">
                📹
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Video Recording</h3>
                <p className="text-xs text-slate-400">Educational Review & Storage Consent</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                Your camera session will be recorded in short encrypted chunks and securely stored in private storage for authorized educational review by your instructor.
              </p>
              <p className="font-semibold text-slate-800">
                🔒 Recording is optional. Audio is never recorded.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancelConsent}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmConsentAndStart}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md shadow-rose-600/20"
              >
                Start Recording
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Camera Preview & Video Container ───────────────────────────────── */}
      {cameraStatus === "active" && !isCompleted && (
        <>
          {/* Video Preview Container */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video max-h-48 shadow-inner border border-slate-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              aria-label="Live student camera preview"
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />

            {/* Connecting Spinner Overlay if dimensions not yet loaded */}
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white gap-2">
                <span className="text-2xl animate-spin">⏳</span>
                <p className="text-xs font-medium text-slate-300">Initializing camera feed…</p>
              </div>
            )}

            {/* Privacy Badge */}
            {cameraReady && (
              <div
                className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] flex items-center gap-1 z-10"
                aria-hidden="true"
              >
                <span>🔒</span>
                <span>100% Local AI</span>
              </div>
            )}

            {/* Recording / LIVE Indicator */}
            {cameraReady && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                {isRecording ? (
                  <div className="px-2.5 py-1 rounded-md bg-rose-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>REC {formattedTime}</span>
                  </div>
                ) : (
                  <div className="px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>LIVE</span>
                  </div>
                )}
              </div>
            )}

            {/* Live Sharing Status Pill */}
            {isLiveSharing && !teacherViewing && (
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-indigo-600/90 text-white text-[10px] font-medium flex items-center gap-1 z-10">
                <span>📡</span>
                <span>Live Sharing Active</span>
              </div>
            )}

            {/* Dimensions readout for development verification */}
            {cameraReady && videoDimensions.width > 0 && (
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-slate-300 z-10 font-mono">
                {videoDimensions.width}x{videoDimensions.height}
              </div>
            )}
          </div>

          {/* AI Engagement Readout */}
          <div
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border transition-all ${cfg.badge}`}
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden="true">{cfg.icon}</span>
              <div>
                <p className="text-xs font-bold">{cfg.label}</p>
                <p className="text-[10px] opacity-75">
                  {faceDetected
                    ? "Face Detected • Real-Time Local AI"
                    : cameraReady
                    ? "No Face Detected in Frame"
                    : "Connecting…"}
                </p>
              </div>
            </div>
            <div className="text-right">
              {confidence !== null ? (
                <>
                  <p className="text-sm font-extrabold">{Math.round(confidence * 100)}%</p>
                  <p className="text-[10px] opacity-70">Confidence</p>
                </>
              ) : (
                <p className="text-xs font-medium text-slate-400">—</p>
              )}
            </div>
          </div>

          {/* Recording / Live Action Bar */}
          <div className="space-y-2 pt-1">
            {/* Primary Recording Button */}
            {!isRecording ? (
              <button
                type="button"
                onClick={requestStartRecording}
                disabled={isStartingRec || !cameraReady}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm shadow-rose-600/20 disabled:opacity-50"
              >
                <span>📹</span>
                <span>{isStartingRec ? "Preparing Server Session…" : "Start Recording"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                disabled={isStoppingRec}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                <span className="w-2 h-2 rounded-sm bg-rose-500 animate-pulse" />
                <span>{isStoppingRec ? "Finalizing…" : `Stop Recording (${formattedTime})`}</span>
              </button>
            )}

            {/* Secondary Actions: WebRTC Live Share & Stop Camera */}
            <div className="flex gap-2">
              {!isLiveSharing ? (
                <button
                  type="button"
                  onClick={startLiveSharing}
                  disabled={!cameraReady}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold transition disabled:opacity-50"
                >
                  <span>📡</span>
                  <span>Live Camera Share</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopLiveSharing}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-300 bg-indigo-100 text-indigo-800 text-xs font-semibold transition"
                >
                  <span>⏹️</span>
                  <span>Stop Live Share</span>
                </button>
              )}

              <button
                type="button"
                onClick={stopCamera}
                disabled={isRecording}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition disabled:opacity-40"
              >
                Stop Camera
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Completed Recording Summary ───────────────────────────────────── */}
      {isCompleted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4 text-center animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
            ✅
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-950">Recording Completed & Saved</h3>
            <p className="text-xs text-emerald-800 mt-0.5">
              Duration: {Math.floor((completedSummary?.durationSeconds || durationSeconds) / 60)}m{" "}
              {(completedSummary?.durationSeconds || durationSeconds) % 60}s
            </p>
            <p className="text-[10px] text-emerald-700 mt-1">
              Encrypted video chunks uploaded to private Supabase Storage for authorized teacher review.
            </p>
          </div>
          <button
            type="button"
            onClick={resetRecording}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm"
          >
            Back to Learning
          </button>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <p className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-3">
        🛡️ Privacy Guarantee: Zero microphone recording • Encrypted private storage • Authorized review only
      </p>
    </div>
  );
}
