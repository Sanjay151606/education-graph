/**
 * MaterialReaderModal.jsx
 *
 * Professional in-app study material reader for students & teachers.
 * Displays structured notes (Objectives, Key Concepts, Detailed Notes,
 * Important Points, Quick Revision, Practice Questions) and embedded PDF documents.
 */

import { useState } from "react";
import v2Api from "../../services/v2_api";

export default function MaterialReaderModal({ material, onClose }) {
  const [activeTab, setActiveTab] = useState("notes"); // notes | objectives | concepts | revision | questions | document
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  if (!material) return null;

  const struct = material.structured_content || {};
  const objectives = struct.learning_objectives || [];
  const concepts = struct.key_concepts || [];
  const importantPoints = struct.important_points || [];
  const quickRevision = struct.quick_revision || "";
  const practiceQuestions = struct.practice_questions || [];
  const detailedNotes = struct.detailed_notes || material.original_content || material.original_text || "";
  const hasFile = Boolean(material.has_file || material.file_name || material.file_path);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      const res = await v2Api.getMaterialSignedUrl(material.id);
      if (res?.signed_url) {
        window.open(res.signed_url, "_blank");
      } else {
        window.open(`/api/study-materials/${material.id}/file`, "_blank");
      }
    } catch (err) {
      console.warn("Signed URL error, falling back to direct stream:", err);
      window.open(`/api/study-materials/${material.id}/file`, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const formattedDate = material.created_at
    ? new Date(material.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently Updated";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="material-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden">
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brain-50 text-brain-700 border border-brain-200">
                {material.subject || "General"}
              </span>
              {material.topic && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                  {material.topic}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {material.material_type || "Notes"}
              </span>
            </div>

            <h2 id="material-title" className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {material.title}
            </h2>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>👤 {material.author_name || "Instructor"}</span>
              <span>•</span>
              <span>📅 {formattedDate}</span>
              {material.tags?.length > 0 && (
                <>
                  <span>•</span>
                  <div className="flex gap-1">
                    {material.tags.map((t, idx) => (
                      <span key={idx} className="text-slate-500">#{t}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {hasFile && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brain-600 hover:bg-brain-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                title="Download study material file"
              >
                <span>📥</span>
                <span>{downloading ? "Preparing…" : "Download"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-lg font-bold transition"
              aria-label="Close reader"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Navigation Tabs ────────────────────────────────────────────────── */}
        <div className="px-6 border-b border-slate-100 bg-white flex gap-2 overflow-x-auto text-xs font-semibold scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "notes"
                ? "border-brain-600 text-brain-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>📖</span>
            <span>Detailed Notes</span>
          </button>

          {objectives.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("objectives")}
              className={`py-3 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "objectives"
                  ? "border-brain-600 text-brain-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>🎯</span>
              <span>Learning Objectives ({objectives.length})</span>
            </button>
          )}

          {concepts.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("concepts")}
              className={`py-3 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "concepts"
                  ? "border-brain-600 text-brain-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>💡</span>
              <span>Key Concepts ({concepts.length})</span>
            </button>
          )}

          {(importantPoints.length > 0 || quickRevision) && (
            <button
              type="button"
              onClick={() => setActiveTab("revision")}
              className={`py-3 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "revision"
                  ? "border-brain-600 text-brain-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>⭐</span>
              <span>Quick Revision</span>
            </button>
          )}

          {practiceQuestions.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("questions")}
              className={`py-3 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "questions"
                  ? "border-brain-600 text-brain-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>❓</span>
              <span>Practice Questions ({practiceQuestions.length})</span>
            </button>
          )}

          {hasFile && (
            <button
              type="button"
              onClick={() => setActiveTab("document")}
              className={`py-3 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "document"
                  ? "border-brain-600 text-brain-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>📄</span>
              <span>Document File ({material.file_name || "Attachment"})</span>
            </button>
          )}
        </div>

        {/* ── Content Body ───────────────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-700 leading-relaxed text-sm">
          {/* Detailed Notes Tab */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              {material.description && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                  <p className="font-semibold mb-1">📝 Overview</p>
                  <p>{material.description}</p>
                </div>
              )}

              {detailedNotes ? (
                <div className="prose prose-slate max-w-none text-slate-800 whitespace-pre-line text-sm sm:text-base leading-relaxed bg-white rounded-2xl p-2">
                  {detailedNotes}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <span className="text-4xl">📄</span>
                  <p>No written notes text provided. Check the attached document file tab.</p>
                </div>
              )}
            </div>
          )}

          {/* Objectives Tab */}
          {activeTab === "objectives" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🎯</span>
                <span>By the end of this module, you will understand:</span>
              </h3>
              <ul className="space-y-3">
                {objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                      ✓
                    </span>
                    <span className="text-sm font-medium text-slate-800 mt-0.5">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Concepts Tab */}
          {activeTab === "concepts" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>💡</span>
                <span>Core Concepts & Definitions</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {concepts.map((concept, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="text-xs font-bold text-brain-700 uppercase tracking-wide">Concept #{idx + 1}</p>
                    <p className="text-sm font-semibold text-slate-800">{concept}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Revision Tab */}
          {activeTab === "revision" && (
            <div className="space-y-5">
              {quickRevision && (
                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                    <span>⚡</span>
                    <span>Quick Revision Summary</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-amber-900 whitespace-pre-line leading-relaxed">
                    {quickRevision}
                  </p>
                </div>
              )}

              {importantPoints.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>⭐</span>
                    <span>Important Points to Remember</span>
                  </h4>
                  <div className="space-y-2">
                    {importantPoints.map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700">
                        <span className="text-amber-500 font-bold shrink-0">★</span>
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Practice Questions Tab */}
          {activeTab === "questions" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>❓</span>
                <span>Self-Assessment & Practice Questions</span>
              </h3>
              <div className="space-y-3">
                {practiceQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <p className="text-xs font-bold text-slate-400">Question {idx + 1}</p>
                    <p className="text-sm font-semibold text-slate-900">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document File / PDF Preview Tab */}
          {activeTab === "document" && hasFile && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📄</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{material.file_name || "Study Document"}</p>
                    <p className="text-xs text-slate-400">{material.file_type || "Attachment"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="px-4 py-2 rounded-xl bg-brain-600 hover:bg-brain-700 text-white text-xs font-bold shadow-sm transition"
                >
                  {downloading ? "Opening…" : "Open / Download"}
                </button>
              </div>

              {/* PDF Preview Frame */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 aspect-4/3 min-h-[400px]">
                <iframe
                  src={`/api/study-materials/${material.id}/file`}
                  title={material.title}
                  className="w-full h-full min-h-[400px] border-0"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>BrainGraph Learning System • Private & Encrypted</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100 transition"
          >
            Close Reader
          </button>
        </div>
      </div>
    </div>
  );
}
