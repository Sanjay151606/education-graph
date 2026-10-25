import React, { useState, useEffect, useCallback } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  Sparkles,
  Award,
  Layers,
  Clock,
  Play,
  RotateCw,
  Trophy,
  RefreshCw,
  CheckCircle,
  HelpCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";
import MatchingActivity from "../components/activities/MatchingActivity";
import FillBlankActivity from "../components/activities/FillBlankActivity";
import FlashcardReview from "../components/activities/FlashcardReview";
import MiniChallenge from "../components/activities/MiniChallenge";

const ACTIVITY_TYPE_CONFIG = {
  matching: { label: "Term Match", icon: "🧩", color: "bg-purple-50 text-purple-700 border-purple-200" },
  fill_blank: { label: "Concept Fill", icon: "✍️", color: "bg-blue-50 text-blue-700 border-blue-200" },
  flashcards: { label: "Spaced Flashcards", icon: "📇", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  mini_challenge: { label: "2-Min Challenge", icon: "⚡", color: "bg-amber-50 text-amber-700 border-amber-200" },
};

export default function ActivityHub() {
  const { user } = useAuth();
  const studentId = user?.id;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all"); // all | matching | fill_blank | flashcards | mini_challenge

  const fetchActivities = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await api.get(`/activities/student/${studentId}`);
      setActivities(res.data || []);
    } catch (err) {
      console.warn("Could not load activities:", err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleLaunch = async (act) => {
    setSelectedActivity(act);
    // Load same-band leaderboard
    try {
      const lbRes = await api.get(`/activities/${act.id}/leaderboard`);
      setLeaderboardData(lbRes.data?.leaderboard || []);
    } catch {
      setLeaderboardData([]);
    }
  };

  const handleActivityComplete = async (score, responseData) => {
    if (!selectedActivity) return;
    try {
      await api.post(`/activities/${selectedActivity.id}/attempt`, {
        score,
        responses: responseData,
      });
      // Refresh leaderboard
      const lbRes = await api.get(`/activities/${selectedActivity.id}/leaderboard`);
      setLeaderboardData(lbRes.data?.leaderboard || []);
    } catch (err) {
      console.warn("Attempt recording error:", err);
    }
  };

  const filtered = activities.filter((a) => {
    if (selectedFilter === "all") return true;
    return a.type === selectedFilter;
  });

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brain-700 via-indigo-700 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🎮</span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Interactive Learning Activities
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-indigo-100/90 max-w-xl">
              Engage through bite-sized matching, concept-fills, spaced-repetition flashcards, and low-pressure mini challenges calibrated to your knowledge band.
            </p>
          </div>

          <button
            onClick={fetchActivities}
            className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer backdrop-blur-xs w-fit"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Active Player View */}
      {selectedActivity ? (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setSelectedActivity(null);
                setLeaderboardData(null);
              }}
              className="text-xs font-bold text-brain-600 hover:text-brain-800 flex items-center gap-1.5 cursor-pointer"
            >
              <span>← Back to Activities Hub</span>
            </button>

            {/* Optional Leaderboard Toggle */}
            <button
              type="button"
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
            >
              {showLeaderboard ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showLeaderboard ? "Hide Same-Band Leaderboard" : "Show Anonymous Leaderboard"}</span>
            </button>
          </div>

          {/* Activity Interactive Engine */}
          {selectedActivity.type === "matching" && (
            <MatchingActivity activity={selectedActivity} onComplete={handleActivityComplete} />
          )}
          {selectedActivity.type === "fill_blank" && (
            <FillBlankActivity activity={selectedActivity} onComplete={handleActivityComplete} />
          )}
          {selectedActivity.type === "flashcards" && (
            <FlashcardReview activity={selectedActivity} onComplete={handleActivityComplete} />
          )}
          {selectedActivity.type === "mini_challenge" && (
            <MiniChallenge activity={selectedActivity} onComplete={handleActivityComplete} />
          )}

          {/* Anonymous Same-Band Leaderboard */}
          {showLeaderboard && leaderboardData && leaderboardData.length > 0 && (
            <Card className="space-y-3 bg-slate-50/70 border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-black text-slate-900">
                    Anonymous Peer Mastery (Scoped to your knowledge band)
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">🔒 Privacy Preserved</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {leaderboardData.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                      item.is_current_user
                        ? "bg-purple-50 border-purple-300 text-purple-900 font-black shadow-xs"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</span>
                      <span>{item.display_name}</span>
                    </div>
                    <span className="font-mono font-bold">{item.score}%</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        /* Activity Selection Grid */
        <div className="space-y-5">
          {/* Type Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: "all", label: "All Activities", icon: "✨" },
              { id: "matching", label: "Term Matching", icon: "🧩" },
              { id: "fill_blank", label: "Fill in the Blank", icon: "✍️" },
              { id: "flashcards", label: "Spaced Flashcards", icon: "📇" },
              { id: "mini_challenge", label: "2-Min Challenge", icon: "⚡" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFilter(f.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  selectedFilter === f.id
                    ? "bg-brain-600 text-white shadow-sm"
                    : "bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <LoadingSpinner label="Loading band-adapted activities…" />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="🎯"
              title="No Activities in this Category"
              description="Switch filter pills or check back later as your teacher adds more interactive exercises."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((act) => {
                const conf = ACTIVITY_TYPE_CONFIG[act.type] || {
                  label: act.type,
                  icon: "🎮",
                  color: "bg-slate-50 text-slate-700 border-slate-200",
                };

                return (
                  <Card
                    key={act.id}
                    className="hover:border-brain-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${conf.color}`}
                        >
                          <span>{conf.icon}</span>
                          <span>{conf.label}</span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Band: {act.knowledge_band || "All"}
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-slate-900 leading-snug">
                        {act.title}
                      </h3>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-semibold">
                        ~2-3 min active sprint
                      </span>
                      <button
                        type="button"
                        onClick={() => handleLaunch(act)}
                        className="px-4 py-2 rounded-xl bg-brain-600 hover:bg-brain-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Launch</span>
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
