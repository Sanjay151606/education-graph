import { useState, useEffect, useRef } from "react";
import v2Api from "../services/v2_api";
import { useWebRTCStream } from "../hooks/useWebRTCStream";
import TeacherMaterialManager from "../components/StudyMaterials/TeacherMaterialManager";
import TeacherClassInsightsCard from "../components/dashboard/TeacherClassInsightsCard";

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState("classroom"); // classroom | materials
  const [sessionId, setSessionId] = useState("class-bio-101");

  const [connected, setConnected] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTopic, setActiveTopic] = useState("Cellular Respiration & Energy Pathways");
  const [recapAcknowledged, setRecapAcknowledged] = useState(false);
  const [cameraInsights, setCameraInsights] = useState(null);

  // Student Recordings State
  const [recordings, setRecordings] = useState([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [signedVideoUrl, setSignedVideoUrl] = useState("");
  const [loadingVideo, setLoadingVideo] = useState(false);

  // WebRTC Live Video State
  const [activeLiveStudent, setActiveLiveStudent] = useState(null);

  const wsRef = useRef(null);

  // WebRTC Stream Hook (Teacher Role)
  const {
    remoteStream,
    remoteVideoRef,
    connectionStatus: webrtcStatus,
    joinStudentLive,
    leaveStudentLive,
    handleTeacherSignal,
  } = useWebRTCStream({
    sessionId,
    role: "teacher",
    userId: "teacher-demo-id",
    wsRef,
  });

  // 1. Connect Teacher WebSocket
  useEffect(() => {
    setLoading(true);
    setError("");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname === "localhost" ? "localhost:8000" : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/engagement/${sessionId}?role=teacher`;

    let socket;
    try {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
        setLoading(false);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Route WebRTC signaling messages
          if (data.type && (data.type.startsWith("webrtc_") || data.type === "live_stream_stopped" || data.type === "live_stream_started")) {
            handleTeacherSignal(data);
          } else {
            setSummary(data);
            setLoading(false);
          }
        } catch (e) {
          console.warn("Error parsing teacher WS payload:", e);
        }
      };

      socket.onclose = () => {
        setConnected(false);
      };

      socket.onerror = () => {
        setConnected(false);
        v2Api.getClassSummary(sessionId).then((data) => {
          setSummary(data);
          setLoading(false);
        }).catch(() => setLoading(false));
      };
    } catch (err) {
      console.warn("WebSocket init error:", err);
      setConnected(false);
      v2Api.getClassSummary(sessionId).then((data) => {
        setSummary(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [sessionId, handleTeacherSignal]);

  // 2. Periodic REST poll fallback if disconnected
  useEffect(() => {
    if (connected) return;
    const interval = setInterval(() => {
      v2Api.getClassSummary(sessionId).then((data) => {
        setSummary(data);
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [connected, sessionId]);

  // 3. Camera engagement insights — polls every 12s
  useEffect(() => {
    const fetchInsights = () => {
      v2Api.getTeacherClassSummary(sessionId)
        .then((data) => setCameraInsights(data))
        .catch((err) => {
          if (err?.response?.status !== 403) {
            console.warn("Camera insights fetch failed:", err?.message);
          }
        });
    };
    fetchInsights();
    const interval = setInterval(fetchInsights, 12000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // 4. Fetch Session Recordings — polls every 15s
  useEffect(() => {
    const fetchRecordings = () => {
      setLoadingRecordings(true);
      v2Api.getSessionRecordings(sessionId)
        .then((data) => {
          setRecordings(data || []);
          setLoadingRecordings(false);
        })
        .catch((err) => {
          setLoadingRecordings(false);
        });
    };
    fetchRecordings();
    const interval = setInterval(fetchRecordings, 15000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // 5. Open and Play a Student Recording with Signed URL
  const handleViewRecording = async (rec) => {
    setSelectedRecording(rec);
    setLoadingVideo(true);
    setSignedVideoUrl("");
    try {
      const res = await v2Api.getRecordingSignedUrl(rec.id);
      setSignedVideoUrl(res.signed_url);
    } catch (err) {
      console.warn("Failed to get signed video URL:", err);
      // Fallback directly to server video stream
      setSignedVideoUrl(`/api/recordings/${rec.id}/video`);
    } finally {
      setLoadingVideo(false);
    }
  };

  const closeRecordingModal = () => {
    setSelectedRecording(null);
    setSignedVideoUrl("");
  };

  // 6. WebRTC Live Camera Join/Leave
  const handleJoinLiveCamera = (studentIndex) => {
    setActiveLiveStudent(`Student #${studentIndex}`);
    joinStudentLive(`student-${studentIndex}`);
  };

  const handleLeaveLiveCamera = () => {
    if (activeLiveStudent) {
      leaveStudentLive(activeLiveStudent);
    }
    setActiveLiveStudent(null);
  };

  const tiles = summary?.tiles || [];
  const activeCount = summary?.active_students_count || 0;
  const focusedCount = summary?.focused_count || 0;
  const mildConfusionCount = summary?.mild_confusion_count || 0;
  const lostCount = summary?.lost_or_disengaged_count || 0;
  const comprehensionPct = summary?.comprehension_rate_pct || 0;
  const showAlert = summary?.comprehension_drop_alert && !recapAcknowledged;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* ── Header & Controls ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">👩‍🏫</span>
            <h1 className="text-2xl font-bold text-slate-900">Live Classroom Engagement & Review Dashboard</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                connected
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
              <span>{connected ? "Live Stream (WebSocket)" : "Polling (REST Sync)"}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time aggregate attention, private student recordings, and WebRTC live view. 🔒 <strong>Privacy Protected:</strong> Encrypted storage & authorized review only.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <label className="block text-[10px] uppercase font-bold text-slate-400">Class Session Code</label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => {
                setSessionId(e.target.value);
                setRecapAcknowledged(false);
              }}
              className="text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-brain-500"
            />
          </div>
        </div>
      </div>

      {/* ── Tab Switcher ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("classroom")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "classroom"
              ? "bg-brain-600 text-white shadow-sm shadow-brain-600/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <span>📡</span>
          <span>Live Classroom</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("materials")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "materials"
              ? "bg-brain-600 text-white shadow-sm shadow-brain-600/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <span>📚</span>
          <span>Study Materials</span>
        </button>
      </div>

      {activeTab === "materials" ? (
        <TeacherMaterialManager />
      ) : (
        <>
          {/* ── Section B Feature 5: AI Pre-Lesson Class Insights ───────────── */}
          <TeacherClassInsightsCard topic={activeTopic} />

          {/* ── Auto-Alert Banner ─────────────────────────────────────────────── */}
          {showAlert && (
            <div className="p-5 rounded-3xl bg-amber-500 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-bounce-short">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚠️</span>
                <div>
                  <h2 className="text-base font-bold">Comprehension Alert: Pacing Check Suggested</h2>
                  <p className="text-xs text-amber-100 mt-0.5">

                Over 25% of active students are currently exhibiting mild confusion or concept loss. Consider pausing for a 2-minute checkpoint or recap.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRecapAcknowledged(true)}
              className="px-4 py-2 rounded-xl bg-white text-amber-900 text-xs font-bold hover:bg-amber-50 transition shadow-sm"
            >
              Acknowledge & Recap
            </button>
          </div>
        </div>
      )}

      {/* ── WebRTC Live Student Video Feed (when connected) ────────────────── */}
      {activeLiveStudent && (
        <div className="bg-slate-950 rounded-3xl p-6 shadow-xl border border-slate-800 text-white space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <h2 className="text-base font-bold text-white">Live WebRTC Camera: {activeLiveStudent}</h2>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs font-mono">
                {webrtcStatus === "connected" ? "● P2P Connected" : "Connecting…"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLeaveLiveCamera}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition"
            >
              Disconnect Live View
            </button>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-72 flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              controls
              className="w-full h-full object-cover"
            />
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <span className="text-3xl animate-spin">⏳</span>
                <p className="text-xs">Establishing direct WebRTC peer connection…</p>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            🔒 Direct browser-to-browser WebRTC connection. Video is streamed in real-time and never saved on PostgreSQL.
          </p>
        </div>
      )}

      {/* ── Aggregate Metric Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 font-semibold uppercase">Active Students</div>
          <div className="text-3xl font-bold text-slate-900 flex items-baseline gap-2">
            <span>{activeCount}</span>
            <span className="text-xs text-slate-400 font-normal">in session</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">100% anonymized live stream</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 font-semibold uppercase">Comprehension Rate</div>
          <div className="text-3xl font-bold text-emerald-600 flex items-baseline gap-1">
            <span>{comprehensionPct}%</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {focusedCount} students fully on-track
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 font-semibold uppercase">Mild Confusion</div>
          <div className="text-3xl font-bold text-amber-500 flex items-baseline gap-1">
            <span>{mildConfusionCount}</span>
            <span className="text-xs text-slate-400 font-normal">students</span>
          </div>
          <div className="text-[11px] text-slate-500">May need subtle clarification</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 font-semibold uppercase">Lost / Distracted</div>
          <div className="text-3xl font-bold text-rose-500 flex items-baseline gap-1">
            <span>{lostCount}</span>
            <span className="text-xs text-slate-400 font-normal">students</span>
          </div>
          <div className="text-[11px] text-slate-500">Receiving auto micro-break nudges</div>
        </div>
      </div>

      {/* ── Classroom Grid (Anonymous Aggregate Tiles + WebRTC Connect) ───── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Classroom Grid (Anonymous Aggregate Tiles)</h2>
            <p className="text-xs text-slate-400">
              Click any student tile to initiate an authorized 1-on-1 live WebRTC camera session.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Focused ({focusedCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span>Mild Confusion ({mildConfusionCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span>Lost / Away ({lostCount})</span>
            </div>
          </div>
        </div>

        {/* Student Grid Layout */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3 py-2">
          {tiles.map((tile) => {
            const colorClass =
              tile.color_code === "green"
                ? "bg-emerald-500/10 border-emerald-400 text-emerald-800 hover:bg-emerald-500/20"
                : tile.color_code === "yellow"
                ? "bg-amber-400/15 border-amber-400 text-amber-800 hover:bg-amber-400/25"
                : "bg-rose-500/10 border-rose-400 text-rose-800 hover:bg-rose-500/20";

            const dotClass =
              tile.color_code === "green"
                ? "bg-emerald-500"
                : tile.color_code === "yellow"
                ? "bg-amber-400"
                : "bg-rose-500";

            return (
              <button
                key={tile.student_index}
                type="button"
                onClick={() => handleJoinLiveCamera(tile.student_index)}
                title={`Student #${tile.student_index} — Click to request WebRTC Live Camera`}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 text-center transition-all duration-200 cursor-pointer ${colorClass}`}
              >
                <div className="relative">
                  <span className="text-xl">
                    {tile.color_code === "green" ? "🧑‍🎓" : tile.color_code === "yellow" ? "🤔" : "🙋"}
                  </span>
                  <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${dotClass}`} />
                </div>
                <span className="text-[10px] font-mono font-bold">#{tile.student_index}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Student Recordings Section ────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📹</span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Camera Recordings</h2>
              <p className="text-xs text-slate-400">
                Encrypted WebM recordings stored in private Supabase Storage • Short-lived signed URLs only
              </p>
            </div>
          </div>
          <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            {recordings.length} Recorded Sessions
          </span>
        </div>

        {loadingRecordings && recordings.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
            Loading session recordings…
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-8 text-slate-400 space-y-2">
            <span className="text-3xl">📹</span>
            <p className="text-sm font-medium">No student recordings in this session yet</p>
            <p className="text-xs">Recordings will appear here when students complete a recorded learning session.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px]">
                  <th className="pb-3 px-3">Student</th>
                  <th className="pb-3 px-3">Session</th>
                  <th className="pb-3 px-3">Duration</th>
                  <th className="pb-3 px-3">Date / Time</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recordings.map((rec) => {
                  const m = Math.floor(rec.duration_seconds / 60).toString().padStart(2, "0");
                  const s = (rec.duration_seconds % 60).toString().padStart(2, "0");
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-brain-50 text-brain-700 flex items-center justify-center text-[10px] font-bold">
                          {rec.student_name ? rec.student_name[0] : "S"}
                        </span>
                        <span>{rec.student_name}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{rec.session_id}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">{m}:{s}</td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(rec.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleViewRecording(rec)}
                          className="px-3 py-1.5 rounded-xl bg-brain-600 hover:bg-brain-700 text-white text-xs font-bold transition shadow-xs"
                        >
                          View Recording
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Playback Modal (Signed Video URL) ─────────────────────────────── */}
      {selectedRecording && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📹</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Recording: {selectedRecording.student_name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Session: {selectedRecording.session_id} • Duration:{" "}
                    {Math.floor(selectedRecording.duration_seconds / 60)}m{" "}
                    {selectedRecording.duration_seconds % 60}s
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeRecordingModal}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {loadingVideo ? (
              <div className="aspect-video bg-slate-950 rounded-2xl flex flex-col items-center justify-center text-white space-y-2">
                <span className="text-3xl animate-spin">⏳</span>
                <p className="text-xs">Generating short-lived secure signed URL…</p>
              </div>
            ) : signedVideoUrl ? (
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-inner">
                <video
                  controls
                  autoPlay
                  src={signedVideoUrl}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center text-xs text-slate-500">
                Could not load recording stream.
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>🔒 Signed URL expires in 5 minutes • Private educational storage</span>
              <button
                type="button"
                onClick={closeRecordingModal}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition text-xs"
              >
                Close Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Camera Engagement Insights (teacher-auth section) ──────────── */}
      {cameraInsights && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">📷</span>
              <div>
                <h2 className="text-base font-bold text-slate-900">AI Camera Engagement Insights</h2>
                <p className="text-xs text-slate-400">
                  Camera-derived engagement states (last 5 minutes) · Derived signals only · No video stored
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Overall: {cameraInsights.overall_engagement_pct}% Engaged
              </span>
              <span className="text-[10px] text-slate-400">
                Updated: {new Date(cameraInsights.last_updated).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Focused",             count: cameraInsights.focused,             color: "emerald", icon: "🎯" },
              { label: "Possibly Confused",    count: cameraInsights.possibly_confused,   color: "amber",   icon: "🤔" },
              { label: "Possibly Disengaged",  count: cameraInsights.possibly_disengaged, color: "rose",    icon: "💭" },
              { label: "No Face Detected",     count: cameraInsights.no_face,             color: "slate",   icon: "👻" },
              { label: "Camera Unavailable",   count: cameraInsights.camera_off,          color: "slate",   icon: "📷" },
            ].map(({ label, count, color, icon }) => (
              <div
                key={label}
                className={`p-4 rounded-2xl border bg-${color}-50/70 border-${color}-200 space-y-1`}
              >
                <div className="flex items-center gap-1.5">
                  <span aria-hidden="true">{icon}</span>
                  <span className={`text-[11px] font-bold text-${color}-800 uppercase tracking-wide`}>{label}</span>
                </div>
                <div className={`text-2xl font-black text-${color}-900`}>{count}</div>
                <p className="text-[10px] text-slate-500 font-medium">
                  {cameraInsights.total_events > 0
                    ? `${Math.round((count / cameraInsights.total_events) * 100)}% of events`
                    : "No events yet"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

