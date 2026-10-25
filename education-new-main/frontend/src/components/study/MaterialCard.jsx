import React from "react";
import { BookOpen, FileText, Download, Sparkles, Layers, CheckCircle2, Award } from "lucide-react";

export default function MaterialCard({ material, onOpen, onDownload }) {
  const isDoc = ["PDF", "Document", "Presentation"].includes(material.material_type) || Boolean(material.file_name || material.source_file_name);
  const hasFile = Boolean(material.file_name || material.source_file_name || material.file_path);
  const targetBand = material.knowledge_band_target || material.target_band || "all";

  // Band badge configuration
  const getBandBadge = (band) => {
    switch (band?.toLowerCase()) {
      case "foundation":
        return {
          label: "Foundation",
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
          icon: "🥉",
        };
      case "on_track":
        return {
          label: "On Track",
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          icon: "🥈",
        };
      case "advanced":
        return {
          label: "Advanced",
          bg: "bg-purple-50",
          text: "text-purple-700",
          border: "border-purple-200",
          icon: "🥇",
        };
      default:
        return {
          label: "All Learners",
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-200",
          icon: "🌐",
        };
    }
  };

  const bandBadge = getBandBadge(targetBand);

  // Extract preview text
  const previewText =
    material.structured_content?.summary ||
    (material.simplified_content ? material.simplified_content.replace(/#+\s.*/g, "").trim().slice(0, 160) + "..." : null) ||
    material.description ||
    (material.original_content ? material.original_content.slice(0, 160) + "..." : "No preview available.");

  const chunkCount = material.structured_content?.sections?.length || 0;
  const takeawayCount = material.structured_content?.key_takeaways?.length || 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between p-5 space-y-4 group hover:border-brain-300">
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brain-50 text-brain-700 border border-brain-200">
              {material.subject || "General"}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${bandBadge.bg} ${bandBadge.text} ${bandBadge.border}`}
            >
              <span>{bandBadge.icon}</span>
              <span>{bandBadge.label}</span>
            </span>
          </div>

          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
            {material.material_type || "Notes"}
          </span>
        </div>

        {/* Title and Topic */}
        <div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-brain-600 transition line-clamp-2">
            {material.title}
          </h3>
          {material.topic && (
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Topic: {material.topic}
            </p>
          )}
        </div>

        {/* Summary / Preview */}
        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
          {previewText}
        </p>

        {/* Quick Highlights / Metrics */}
        <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] text-slate-500 font-medium">
          {chunkCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200/60">
              <Layers className="w-3 h-3 text-indigo-500" />
              {chunkCount} Chunked Sections
            </span>
          )}
          {takeawayCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200/60">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              {takeawayCount} Takeaways
            </span>
          )}
          {material.simplified_content && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60 font-semibold">
              <Sparkles className="w-3 h-3 text-purple-600" />
              AI Student Format
            </span>
          )}
        </div>

        {/* Attachment Indicator */}
        {(material.source_file_name || material.file_name) && (
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 font-medium truncate">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{material.source_file_name || material.file_name}</span>
          </div>
        )}

        {/* Tags */}
        {material.tags && material.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {material.tags.slice(0, 3).map((t, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 text-[10px] font-medium border border-slate-100"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onOpen(material)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brain-600 hover:bg-brain-700 text-white text-xs font-bold shadow-sm shadow-brain-600/20 transition cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{isDoc ? "Open Student Reader" : "Read Chunked Notes"}</span>
        </button>

        {hasFile && onDownload && (
          <button
            type="button"
            onClick={() => onDownload(material)}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            title="Download source attachment"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
