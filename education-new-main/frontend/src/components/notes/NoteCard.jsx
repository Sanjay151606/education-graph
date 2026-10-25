/**
 * NoteCard.jsx
 *
 * Clean, responsive card for a student note:
 * - Title, subject, unit/chapter, author, upload date
 * - File type badge & size preview
 * - Read / Completed status indicator
 * - Conditional Download button (hidden/view-only if allow_download is false)
 * - Strict NO icons, NO emojis rule.
 */

import { useState } from "react";
import v2Api from "../../services/v2_api";

export default function NoteCard({
  note,
  onView,
  onToggleRead,
}) {
  const [isRead, setIsRead] = useState(Boolean(note?.is_read));
  const [isMarking, setIsMarking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const fileTypeLabel = (
    note?.file_type?.includes("pdf") || note?.file_name?.endsWith(".pdf")
      ? "PDF"
      : note?.file_name?.endsWith(".docx") || note?.file_name?.endsWith(".doc")
      ? "DOCX"
      : note?.file_name?.endsWith(".pptx") || note?.file_name?.endsWith(".ppt")
      ? "PPTX"
      : note?.file_name?.endsWith(".png") || note?.file_name?.endsWith(".jpg")
      ? "IMAGE"
      : note?.material_type || "NOTES"
  ).toUpperCase();

  const formattedDate = note?.created_at
    ? new Date(note.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Recently added";

  const formattedSize = note?.file_size
    ? note.file_size > 1024 * 1024
      ? `${(note.file_size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(note.file_size / 1024)} KB`
    : null;

  const handleToggleRead = async (e) => {
    e.stopPropagation();
    if (!note?.id) return;
    const nextState = !isRead;
    setIsRead(nextState);
    setIsMarking(true);
    try {
      await v2Api.markNoteAsRead(note.id, nextState);
      if (onToggleRead) onToggleRead(note.id, nextState);
    } catch (err) {
      console.error("Failed to mark note as read:", err);
      setIsRead(!nextState);
    } finally {
      setIsMarking(false);
    }
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (!note?.allow_download) return;

    setIsDownloading(true);
    try {
      const res = await v2Api.getMaterialSignedUrl(note.id);
      if (res?.signed_url) {
        window.open(res.signed_url, "_blank");
      } else {
        window.open(`/api/study-materials/${note.id}/file`, "_blank");
      }
    } catch (err) {
      console.warn("Direct download fallback:", err);
      window.open(`/api/study-materials/${note.id}/file`, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      onClick={() => onView && onView(note)}
      className="group bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md"
    >
      <div className="space-y-3">
        {/* Badges Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {note?.subject || "General"}
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {fileTypeLabel}
            </span>
            {formattedSize && (
              <span className="text-[10px] font-mono text-slate-400">
                {formattedSize}
              </span>
            )}
          </div>

          {/* Read / Unread Status Badge */}
          {isRead ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              [Completed]
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              [Unread]
            </span>
          )}
        </div>

        {/* Title & Topic */}
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2">
            {note?.title || "Untitled Note"}
          </h3>
          {note?.topic && (
            <p className="text-xs font-medium text-slate-400 mt-1 line-clamp-1">
              Unit: {note.topic}
            </p>
          )}
        </div>

        {/* Short Description */}
        {note?.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {note.description}
          </p>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>By {note?.author_name || "Instructor"}</span>
          <span>{formattedDate}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Mark Read Toggle */}
          <button
            type="button"
            onClick={handleToggleRead}
            disabled={isMarking}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors border ${
              isRead
                ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
                : "bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/30"
            }`}
          >
            {isMarking
              ? "Updating..."
              : isRead
              ? "Mark Unread"
              : "Mark as Read"}
          </button>

          <div className="flex items-center gap-1.5">
            {/* Conditional Download */}
            {note?.allow_download ? (
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
              >
                {isDownloading ? "Opening..." : "Download"}
              </button>
            ) : (
              <span className="text-[10px] font-medium text-amber-400/80 bg-slate-800/60 px-2 py-0.5 rounded border border-amber-500/20">
                View Only
              </span>
            )}

            {/* View Note */}
            <button
              type="button"
              onClick={() => onView && onView(note)}
              className="px-3 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
