/**
 * StudyMaterials.jsx
 *
 * Student Study Materials Dashboard:
 * - Real-time database-driven study materials tailored to student's knowledge band & enrolled subjects
 * - Full-text search across title, subject, topic, tags
 * - Subject, material type, and knowledge band filtering
 * - Interactive ADHD-friendly progressive disclosure reader via MaterialViewer
 * - Clear, friendly empty states and loading skeletons
 */

import { useState, useEffect, useCallback } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import v2Api from "../services/v2_api";
import MaterialCard from "../components/study/MaterialCard";
import MaterialViewer from "../components/study/MaterialViewer";
import PracticeQuizModal from "../components/ai/PracticeQuizModal";
import DoubtAssistantModal from "../components/ai/DoubtAssistantModal";
import { Sparkles, Search, BookOpen, Layers, Award, RefreshCw, Filter, HelpCircle, Bot } from "lucide-react";

const SUBJECT_OPTIONS = [
  "All",
  "Biology",
  "Computer Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "History",
  "English",
  "General",
];

const BAND_OPTIONS = [
  { value: "All", label: "All Bands" },
  { value: "foundation", label: "Foundation (Scaffolded)" },
  { value: "on_track", label: "On Track" },
  { value: "advanced", label: "Advanced" },
];

const MATERIAL_TYPE_OPTIONS = [
  "All",
  "Notes",
  "PDF",
  "Document",
  "Presentation",
  "Video",
  "Question Set",
  "Study Guide",
];

export default function StudyMaterials() {
  const { user } = useAuth();
  const studentId = user?.id;

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedBand, setSelectedBand] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [myBands, setMyBands] = useState([]);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [doubtModalOpen, setDoubtModalOpen] = useState(false);

  // 1. Fetch Student Bands info
  useEffect(() => {
    async function loadBands() {
      try {
        const bands = await v2Api.getMyBands();
        setMyBands(bands || []);
      } catch (e) {
        console.warn("Could not load student bands:", e);
      }
    }
    loadBands();
  }, []);

  // 2. Fetch Published Banded Materials for Student
  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let data = [];
      if (studentId) {
        try {
          const res = await api.get(`/study/materials/student/${studentId}`);
          data = res.data || [];
        } catch (studentErr) {
          console.warn("Student banded endpoint fallback:", studentErr);
          data = await v2Api.getStudyMaterials({
            subject: selectedSubject === "All" ? undefined : selectedSubject,
            material_type: selectedType === "All" ? undefined : selectedType,
            search: searchQuery.trim() || undefined,
          });
        }
      } else {
        data = await v2Api.getStudyMaterials({
          subject: selectedSubject === "All" ? undefined : selectedSubject,
          material_type: selectedType === "All" ? undefined : selectedType,
          search: searchQuery.trim() || undefined,
        });
      }
      setMaterials(data || []);
    } catch (err) {
      console.error("Failed to load study materials:", err);
      setError("Unable to load study materials. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [studentId, selectedSubject, selectedType, searchQuery]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // 3. Filter materials by search, subject, band, and type
  const filteredMaterials = materials.filter((m) => {
    // Subject filter
    if (selectedSubject !== "All" && m.subject?.toLowerCase() !== selectedSubject.toLowerCase()) {
      return false;
    }

    // Material type filter
    if (selectedType !== "All" && m.material_type?.toLowerCase() !== selectedType.toLowerCase()) {
      return false;
    }

    // Knowledge band filter
    if (selectedBand !== "All") {
      const matBand = (m.knowledge_band_target || m.target_band || "all").toLowerCase();
      if (matBand !== "all" && matBand !== selectedBand.toLowerCase()) {
        return false;
      }
    }

    // Search keyword query
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      const matchTitle = m.title?.toLowerCase().includes(term);
      const matchSubject = m.subject?.toLowerCase().includes(term);
      const matchTopic = m.topic?.toLowerCase().includes(term);
      const matchDesc = m.description?.toLowerCase().includes(term);
      const matchTags = Array.isArray(m.tags) && m.tags.some((t) => t.toLowerCase().includes(term));
      if (!matchTitle && !matchSubject && !matchTopic && !matchDesc && !matchTags) {
        return false;
      }
    }

    return true;
  });

  // 4. Handle File Download
  const handleDownload = async (mat) => {
    setDownloadingId(mat.id);
    try {
      const res = await v2Api.getMaterialSignedUrl(mat.id);
      if (res?.signed_url) {
        window.open(res.signed_url, "_blank");
      } else {
        window.open(`/api/study-materials/${mat.id}/file`, "_blank");
      }
    } catch (err) {
      console.warn("Signed URL fallback:", err);
      window.open(`/api/study-materials/${mat.id}/file`, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-150">
      {/* ── Page Header Banner ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">📚</span>
              <h1 className="text-2xl font-black text-slate-900">Study Materials & Notes</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              Access curated lecture notes, chapter summaries, and scaffolded study guides adapted
              to your knowledge band and enrolled topics.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setQuizModalOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Take Adaptive Quiz</span>
            </button>

            <button
              onClick={() => setDoubtModalOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-brain-50 text-brain-700 hover:bg-brain-100 border border-brain-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Bot className="w-3.5 h-3.5 text-brain-600" />
              <span>Ask Doubt Assistant</span>
            </button>

            <button
              onClick={fetchMaterials}
              className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ── Active Knowledge Bands Pill Bar ───────────────────────────────── */}
        {myBands && myBands.length > 0 && (
          <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-indigo-900 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              Your Knowledge Bands:
            </span>
            {myBands.map((b, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-full bg-white text-indigo-800 font-bold border border-indigo-200 text-[11px]"
              >
                {b.topic_name || b.topic_id}: <span className="capitalize">{b.band}</span>
              </span>
            ))}
          </div>
        )}

        {/* ── Search & Filter Bar ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          {/* Search Input */}
          <div className="relative sm:col-span-1">
            <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search notes, topics…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500 transition"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
            >
              {SUBJECT_OPTIONS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub === "All" ? "All Subjects" : sub}
                </option>
              ))}
            </select>
          </div>

          {/* Knowledge Band Filter */}
          <div>
            <select
              value={selectedBand}
              onChange={(e) => setSelectedBand(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
            >
              {BAND_OPTIONS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          {/* Material Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
            >
              {MATERIAL_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type === "All" ? "All Types" : type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Error Banner ───────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button
            onClick={() => fetchMaterials()}
            className="text-rose-600 hover:text-rose-900 font-bold ml-2 underline cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── Loading Skeleton ───────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-4">
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <span className="text-3xl animate-spin inline-block">⏳</span>
            <p className="text-xs font-bold text-slate-600">Loading study materials for your band…</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4 animate-pulse"
              >
                <div className="h-5 bg-slate-200 rounded-md w-2/3" />
                <div className="h-3 bg-slate-100 rounded-md w-1/3" />
                <div className="h-16 bg-slate-100 rounded-xl w-full" />
                <div className="h-8 bg-slate-200 rounded-xl w-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Feature 3: Empty State ─────────────────────────────────────────── */}
      {!loading && filteredMaterials.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center text-2xl mx-auto border border-slate-100">
            📚
          </div>
          <h2 className="text-base font-bold text-slate-800">
            No materials added yet for this topic
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            {searchQuery || selectedSubject !== "All" || selectedBand !== "All" || selectedType !== "All"
              ? "No materials matched your specific search and filter criteria. Try clearing or adjusting filters."
              : "Your instructors have not published materials for this topic yet. Check back soon!"}
          </p>
          {(searchQuery || selectedSubject !== "All" || selectedBand !== "All" || selectedType !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedSubject("All");
                setSelectedBand("All");
                setSelectedType("All");
              }}
              className="px-4 py-2 rounded-xl bg-brain-50 text-brain-700 text-xs font-bold hover:bg-brain-100 transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* ── Materials Grid ─────────────────────────────────────────────────── */}
      {!loading && filteredMaterials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((m) => (
            <MaterialCard
              key={m.id}
              material={m}
              onOpen={(mat) => setSelectedMaterial(mat)}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {/* ── In-App Progressive Disclosure Material Viewer ───────────────────── */}
      {selectedMaterial && (
        <MaterialViewer
          material={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
          onDownload={handleDownload}
        />
      )}

      {/* ── Section B Feature 1: Adaptive Practice Quiz Modal ───────────────── */}
      {quizModalOpen && (
        <PracticeQuizModal
          topic={selectedSubject !== "All" ? selectedSubject : "General Science"}
          band={selectedBand !== "All" ? selectedBand : "on_track"}
          onClose={() => setQuizModalOpen(false)}
        />
      )}

      {/* ── Section B Feature 2: ADHD Doubt Assistant Modal ─────────────────── */}
      {doubtModalOpen && (
        <DoubtAssistantModal
          materialTitle={selectedSubject !== "All" ? `${selectedSubject} Concepts` : "General Study"}
          onClose={() => setDoubtModalOpen(false)}
        />
      )}
    </div>
  );
}
