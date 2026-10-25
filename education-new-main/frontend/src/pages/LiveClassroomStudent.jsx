import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FocusTracker from "../components/v2/FocusTracker";
import PrivacyConsentModal from "../components/v2/PrivacyConsentModal";
import MicroBreakPrompt from "../components/v2/MicroBreakPrompt";
import ReducedStimulationToggle, { useStimulation } from "../components/v2/ReducedStimulationMode";
import LiveLectureNotes from "../components/v2/LiveLectureNotes";
import ConfusionBookmark from "../components/v2/ConfusionBookmark";
import v2Api from "../services/v2_api";

export default function LiveClassroomStudent() {
  const [sessionId, setSessionId] = useState("class-bio-101");
  const [currentTopic, setCurrentTopic] = useState("Cellular Respiration & Energy Pathways");
  const [consentGiven, setConsentGiven] = useState(() => {
    return localStorage.getItem("braingraph_privacy_consent") === "true";
  });
  const [showConsentModal, setShowConsentModal] = useState(() => {
    return localStorage.getItem("braingraph_privacy_consent") !== "true";
  });
  const [breakNudgeOpen, setBreakNudgeOpen] = useState(false);
  const [studentState, setStudentState] = useState("focused");
  const [endingSession, setEndingSession] = useState(false);

  const { reducedMode } = useStimulation();
  const navigate = useNavigate();

  const handleAcceptConsent = () => {
    localStorage.setItem("braingraph_privacy_consent", "true");
    setConsentGiven(true);
    setShowConsentModal(false);
  };

  const handleDeclineConsent = () => {
    localStorage.setItem("braingraph_privacy_consent", "false");
    setConsentGiven(false);
    setShowConsentModal(false);
  };

  const handleEndClassroomSession = async () => {
    setEndingSession(true);
    try {
      await v2Api.generateFollowup(sessionId);
      navigate("/followup");
    } catch (e) {
      navigate("/followup");
    } finally {
      setEndingSession(false);
    }
  };

  return (
    <div className={`max-w-7xl mx-auto p-4 md:p-8 space-y-6 ${reducedMode ? "font-sans grayscale-10" : ""}`}>
      {/* Privacy Consent Screen Modal */}
      {showConsentModal && (
        <PrivacyConsentModal
          onAccept={handleAcceptConsent}
          onDecline={handleDeclineConsent}
        />
      )}

      {/* Micro-Break Prompt (Private) */}
      <MicroBreakPrompt
        isOpen={breakNudgeOpen}
        onClose={() => setBreakNudgeOpen(false)}
      />

      {/* Classroom Header Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎓</span>
            <h1 className="text-2xl font-bold text-slate-900">Live Classroom Experience</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Session: {sessionId}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Current Lecture Topic: <strong className="text-slate-800">{currentTopic}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Reduced Stimulation Mode Toggle */}
          <ReducedStimulationToggle />

          {/* Quick Manual Micro-break Trigger */}
          <button
            type="button"
            onClick={() => setBreakNudgeOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold transition"
          >
            <span>🧘</span>
            <span>60s Breath</span>
          </button>

          {/* Finish & View Personalized Follow-up */}
          <button
            type="button"
            disabled={endingSession}
            onClick={handleEndClassroomSession}
            className="px-4 py-2 rounded-xl bg-brain-600 hover:bg-brain-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            {endingSession ? "Analyzing Session..." : "End & View Recap 🎯"}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Column = Focus & Bookmarks, Right Column = Live Notes & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Focus Tracker + Confusion Bookmark */}
        <div className="space-y-6">
          <FocusTracker
            sessionId={sessionId}
            trackingEnabled={consentGiven}
            onStateChange={(st) => setStudentState(st)}
            onNudgeBreak={() => setBreakNudgeOpen(true)}
          />

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>⚡</span>
              <span>Instant Confusion Helper</span>
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              If the instructor moves too fast, tap below. We will silently bookmark this moment and generate a custom simplified recap for you after class.
            </p>
            <ConfusionBookmark
              sessionId={sessionId}
              currentTopic={currentTopic}
            />
          </div>

          {!reducedMode && (
            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/70 space-y-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Privacy Status</span>
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Your video is processed locally in your browser. The teacher’s board only sees anonymous aggregated colors.
              </p>
              <button
                type="button"
                onClick={() => setShowConsentModal(true)}
                className="text-[11px] text-brain-600 hover:text-brain-700 font-semibold underline"
              >
                Review privacy settings
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Real-Time Auto-Chunked Lecture Notes */}
        <div className="lg:col-span-2 space-y-6">
          <LiveLectureNotes topic={currentTopic} />

          {/* Interactive Slide / Discussion Area */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>📽️</span>
                <span>Lecture Companion & Visual Anchors</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">Slide 4 of 12</span>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3 shadow-inner">
              <div className="text-xs font-mono uppercase tracking-wider text-emerald-400">
                Core Concept Breakdown
              </div>
              <h3 className="text-lg font-bold text-white">
                Glycolysis ➔ Krebs Cycle ➔ Electron Transport Chain
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                  <div className="text-xs font-bold text-brain-300">Phase 1: Cytoplasm</div>
                  <div className="text-[11px] text-slate-300">Glucose (6C) splits to 2 Pyruvate (3C). Net 2 ATP.</div>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                  <div className="text-xs font-bold text-amber-300">Phase 2: Matrix</div>
                  <div className="text-[11px] text-slate-300">Krebs Cycle extracts high-energy NADH & FADH2.</div>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                  <div className="text-xs font-bold text-rose-300">Phase 3: Membrane</div>
                  <div className="text-[11px] text-slate-300">Proton gradient powers ATP Synthase to yield ~30 ATP.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
