import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  CheckCircle2,
  FileText,
  Download,
  Award,
  Layers,
  Eye,
  Check,
} from "lucide-react";

export default function MaterialViewer({ material, onClose, onDownload }) {
  const [viewMode, setViewMode] = useState("simplified"); // "simplified" | "original"
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [completedTakeaways, setCompletedTakeaways] = useState({});
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Stop speech when closing or switching tabs
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!material) return null;

  // Extract structured chunks or parse markdown
  const structured = material.structured_content || {};
  let summary = structured.summary;
  let sections = structured.sections || [];
  let keyTakeaways = structured.key_takeaways || [];

  // Fallback parsing if structured is empty but simplified_content markdown exists
  if (!sections.length && material.simplified_content) {
    const raw = material.simplified_content;
    const parts = raw.split("## Core Concepts (Chunked)");
    if (parts.length > 1) {
      // Summary part
      const sumPart = parts[0].replace(/##\s*Summary/i, "").trim();
      if (!summary) summary = sumPart;

      const restParts = parts[1].split("## Key Takeaways");
      const chunkText = restParts[0] || "";
      const rawChunks = chunkText.split(/###\s+/).filter(Boolean);

      sections = rawChunks.map((chunk, idx) => {
        const lines = chunk.trim().split("\n");
        const heading = lines[0].trim() || `Section ${idx + 1}`;
        const content = lines.slice(1).join("\n").trim();
        return { heading, content, key_term: "" };
      });

      if (restParts.length > 1) {
        keyTakeaways = restParts[1]
          .split("\n")
          .map((l) => l.replace(/^[-*]\s*/, "").trim())
          .filter(Boolean);
      }
    } else {
      summary = material.simplified_content.slice(0, 250);
      sections = [
        {
          heading: "Core Notes",
          content: material.simplified_content,
          key_term: "",
        },
      ];
    }
  }

  // If still no sections, build from original_content
  if (!sections.length && material.original_content) {
    summary = material.description || material.title;
    sections = [
      {
        heading: "Full Material Content",
        content: material.original_content,
        key_term: "",
      },
    ];
    keyTakeaways = [
      "Review the core terms in this material.",
      "Summarize the main concepts in your own words.",
    ];
  }

  // Speech synthesis toggle
  const toggleSpeech = (text) => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleTakeaway = (idx) => {
    setCompletedTakeaways((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const targetBand = material.knowledge_band_target || material.target_band || "all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brain-50 text-brain-700 border border-brain-200">
                {material.subject || "General"}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                Band: {targetBand}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                By {material.author_name || "Instructor"}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
              {material.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            title="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Mode Toggle Bar ─────────────────────────────────────────────── */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600">
            <button
              onClick={() => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                setIsSpeaking(false);
                setViewMode("simplified");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                viewMode === "simplified"
                  ? "bg-white text-brain-700 shadow-xs font-black"
                  : "hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Simplified (ADHD Progressive Disclosure)</span>
            </button>
            <button
              onClick={() => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                setIsSpeaking(false);
                setViewMode("original");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                viewMode === "original"
                  ? "bg-white text-brain-700 shadow-xs font-black"
                  : "hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Original Full Material</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {(material.source_file_name || material.file_name) && onDownload && (
              <button
                onClick={() => onDownload(material)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download File</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Content Body ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {viewMode === "simplified" ? (
            <>
              {/* 1. Summary Callout */}
              {summary && (
                <div className="p-5 rounded-3xl bg-gradient-to-br from-brain-50/70 via-indigo-50/40 to-white border border-brain-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-brain-800 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-brain-600" />
                      1-Paragraph Quick Summary
                    </span>
                    <button
                      onClick={() => toggleSpeech(summary)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-brain-700 hover:bg-white/80 transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Read summary aloud"
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-[11px] text-rose-600">Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-brain-600" />
                          <span className="text-[11px] text-slate-600">Listen</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {summary}
                  </p>
                </div>
              )}

              {/* 2. Progressive Disclosure Accordion Sections */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Chunked Focus Breakdown ({sections.length} Sections)</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold">
                    One section active at a time
                  </span>
                </div>

                <div className="space-y-3">
                  {sections.map((section, idx) => {
                    const isOpen = activeSectionIndex === idx;

                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                          isOpen
                            ? "bg-white border-brain-400 shadow-md ring-2 ring-brain-500/10"
                            : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {/* Section Header Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSectionIndex(isOpen ? -1 : idx);
                            if (window.speechSynthesis) window.speechSynthesis.cancel();
                            setIsSpeaking(false);
                          }}
                          className="w-full px-5 py-3.5 flex items-center justify-between text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                                isOpen
                                  ? "bg-brain-600 text-white"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span
                              className={`text-sm font-bold ${
                                isOpen ? "text-brain-900" : "text-slate-800"
                              }`}
                            >
                              {section.heading || `Section ${idx + 1}`}
                            </span>
                          </div>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-brain-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        {/* Section Content */}
                        {isOpen && (
                          <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-100 animate-in fade-in duration-150">
                            <div className="prose prose-sm text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                              {section.content}
                            </div>

                            {section.key_term && (
                              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
                                <span className="font-bold">🔑 Key Term:</span>{" "}
                                {section.key_term}
                              </div>
                            )}

                            {/* Audio Read Aloud & Step Navigation */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <button
                                onClick={() => toggleSpeech(`${section.heading}. ${section.content}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                              >
                                {isSpeaking ? (
                                  <>
                                    <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Stop Speech</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3.5 h-3.5 text-brain-600" />
                                    <span>Listen to Section</span>
                                  </>
                                )}
                              </button>

                              <div className="flex items-center gap-2">
                                {idx > 0 && (
                                  <button
                                    onClick={() => setActiveSectionIndex(idx - 1)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                                  >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    <span>Previous</span>
                                  </button>
                                )}
                                {idx < sections.length - 1 && (
                                  <button
                                    onClick={() => setActiveSectionIndex(idx + 1)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brain-600 hover:bg-brain-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                                  >
                                    <span>Next Section</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Key Takeaways Checklist */}
              {keyTakeaways && keyTakeaways.length > 0 && (
                <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-black text-emerald-950">
                      Key Takeaways Checklist
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Click items as you master them to track your retention:
                  </p>

                  <div className="space-y-2 pt-1">
                    {keyTakeaways.map((takeaway, idx) => {
                      const done = Boolean(completedTakeaways[idx]);

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleTakeaway(idx)}
                          className={`w-full p-3 rounded-2xl flex items-start gap-3 text-left transition border cursor-pointer ${
                            done
                              ? "bg-white border-emerald-300 text-emerald-900 line-through opacity-80"
                              : "bg-white/90 border-emerald-100 hover:border-emerald-200 text-slate-800"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 mt-0.5 ${
                              done
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {done && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <span className="text-xs font-medium leading-relaxed">
                            {takeaway}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ── Original Full Text Mode ──────────────────────────────────── */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700">Original Document / Content</span>
                  {material.source_file_name && (
                    <p className="text-[11px] text-slate-500">Source: {material.source_file_name}</p>
                  )}
                </div>
                {onDownload && (material.source_file_name || material.file_name) && (
                  <button
                    onClick={() => onDownload(material)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brain-600 hover:bg-brain-700 text-white text-xs font-bold transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Original</span>
                  </button>
                )}
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                {material.original_content ||
                  material.description ||
                  "No raw text content available for this material."}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>🧠 BrainGraph ADHD Progressive Disclosure System</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
