import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import CameraPanel from "../CameraEngagement/CameraPanel";

export default function FocusTracker({
  sessionId,
  trackingEnabled = true,
  onStateChange,
  onNudgeBreak,
}) {
  const { user } = useAuth();
  const [currentState, setCurrentState] = useState("focused");
  const [confidence, setConfidence] = useState(0.88);
  const [wsConnected, setWsConnected] = useState(false);
  const [manualOverride, setManualOverride] = useState(null);
  const [consecutiveDistractionCount, setConsecutiveDistractionCount] = useState(0);

  const wsRef = useRef(null);
  const lastStateRef = useRef("focused");

  // Extended state config supporting both legacy and new engagement states
  const stateConfig = {
    focused:               { label: "Focused & Engaged",    badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", icon: "🎯" },
    possibly_confused:     { label: "Possibly Confused",    badge: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-500",  icon: "🤔" },
    possibly_disengaged:   { label: "Possibly Disengaged",  badge: "bg-rose-50 text-rose-700 border-rose-200",     dot: "bg-rose-400",   icon: "💭" },
    no_face:               { label: "No Face Detected",     badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400",  icon: "👻" },
    camera_off:            { label: "Camera Off",           badge: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-300",  icon: "📷" },
    unknown:               { label: "Estimating…",          badge: "bg-indigo-50 text-indigo-600 border-indigo-200",dot: "bg-indigo-300 animate-pulse", icon: "🔍" },
    // Legacy states (WebSocket mode)
    mild_confusion: { label: "Mild Confusion", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", icon: "🤔" },
    lost:           { label: "Concept Lost",   badge: "bg-rose-50 text-rose-700 border-rose-200",   dot: "bg-rose-500", icon: "❓" },
    disengaged:     { label: "Taking a Break", badge: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400", icon: "⏸️" },
  };

  // Camera is now managed by CameraPanel (opt-in only — no auto-start here)

  // 2. Connect WebSocket to live classroom hub
  useEffect(() => {
    if (!sessionId) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname === "localhost" ? "localhost:8000" : window.location.host;
    const resolvedUserId = user?.id || "demo-student-id";
    const wsUrl = `${protocol}//${host}/ws/engagement/${sessionId}?role=student&user_id=${resolvedUserId}`;

    let socket;
    try {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setWsConnected(true);
      };

      socket.onclose = () => {
        setWsConnected(false);
      };

      socket.onerror = (err) => {
        console.warn("WebSocket error:", err);
        setWsConnected(false);
      };
    } catch (e) {
      console.warn("Could not initiate WebSocket:", e);
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [sessionId, user]);

  // Handles state updates from CameraPanel (camera engagement events)
  const handleCameraStateChange = useCallback((state) => {
    if (!trackingEnabled) return;
    const computedConfidence = 0.85;
    setCurrentState(state);
    setConfidence(computedConfidence);
    lastStateRef.current = state;
    if (onStateChange) onStateChange(state);

    // Micro-break nudge on repeated confused/disengaged signals
    const isNonFocused = ["possibly_confused", "possibly_disengaged", "no_face", "mild_confusion", "lost", "disengaged"].includes(state);
    if (isNonFocused) {
      setConsecutiveDistractionCount((prev) => {
        const next = prev + 1;
        if (next >= 4 && onNudgeBreak) {
          onNudgeBreak();
        }
        return next;
      });
    } else {
      setConsecutiveDistractionCount(0);
    }

    // Forward to teacher via WebSocket (minimal JSON, no video)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          state,
          confidence: computedConfidence,
          metadata: { onDeviceLocal: true },
        })
      );
    }
  }, [trackingEnabled, onStateChange, onNudgeBreak]);

  const currentCfg = stateConfig[currentState] || stateConfig.focused;

  return (
    <div className="space-y-4">
      {/* Connection status strip */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
        <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
        <span>{wsConnected ? "Connected to classroom live stream" : "Syncing to classroom…"}</span>
        {currentState !== "camera_off" && (
          <span className={`ml-auto px-2 py-0.5 rounded-full border text-[10px] font-semibold ${(stateConfig[currentState] || stateConfig.focused).badge}`}>
            {(stateConfig[currentState] || stateConfig.focused).label}
          </span>
        )}
      </div>

      {/* Camera panel (opt-in) */}
      {trackingEnabled && (
        <CameraPanel
          sessionId={sessionId}
          userId={user?.id}
          wsRef={wsRef}
          onStateChange={handleCameraStateChange}
        />
      )}
    </div>
  );
}
