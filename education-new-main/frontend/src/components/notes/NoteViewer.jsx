/**
 * NoteViewer.jsx
 *
 * Full-featured in-app viewer for student study notes:
 * - PDF documents (via native in-browser iframe viewer)
 * - PNG / JPG images (zoomable image container)
 * - Office documents (DOCX, PPTX) via embedded viewer or preview
 * - Interactive structured modules (including Assignment One)
 * - Conditional Download (disabled/hidden if allow_download is false)
 * - Mark as Read toggle action
 * - Strict NO icons, NO emojis rule.
 */

import { useState, useEffect } from "react";
import AssignmentOneContent from "./AssignmentOneContent";
import v2Api from "../../services/v2_api";

export default function NoteViewer({
  note,
  onClose,
  onToggleRead,
  isRead: initialIsRead,
}) {
  const [isRead, setIsRead] = useState(Boolean(initialIsRead));
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    setIsRead(Boolean(initialIsRead ?? note?.is_read));
  }, [initialIsRead, note?.is_read]);

  // Determine file type
  const fileName = (note?.file_name || "").toLowerCase();
  const fileType = (note?.file_type || "").toLowerCase();
  const title = (note?.title || "").toLowerCase();

  const isAssignmentOne =
    title.includes("assignment one") ||
    title.includes("assignment number one") ||
    fileName.includes("assignment_one");

  const isPdf =
    fileType.includes("pdf") ||
    fileName.endsWith(".pdf") ||
    note?.material_type === "PDF" ||
    isAssignmentOne;

  const isImage =
    fileType.includes("image") ||
    fileName.endsWith(".png") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg");

  const isOfficeDoc =
    fileName.endsWith(".docx") ||
    fileName.endsWith(".doc") ||
    fileName.endsWith(".pptx") ||
    fileName.endsWith(".ppt");

  // Fetch signed URL or resolve direct stream
  useEffect(() => {
    if (isAssignmentOne && !note?.file_path) {
      setFileUrl("/assignment_one_30_questions.pdf");
      return;
    }

    if (note?.id && (note.has_file || note.file_name)) {
      setIsLoadingUrl(true);
      v2Api
        .getMaterialSignedUrl(note.id)
        .then((res) => {
          if (res?.signed_url) {
            setFileUrl(res.signed_url);
          } else {
            setFileUrl(`/api/study-materials/${note.id}/file`);
          }
        })
        .catch(() => {
          setFileUrl(`/api/study-materials/${note.id}/file`);
        })
        .finally(() => {
          setIsLoadingUrl(false);
        });
    }
  }, [note, isAssignmentOne]);

  const handleToggleRead = async () => {
    if (!note?.id) return;
    const nextState = !isRead;
    setIsRead(nextState);
    setIsMarkingRead(true);
    try {
      await v2Api.markNoteAsRead(note.id, nextState);
      if (onToggleRead) onToggleRead(note.id, nextState);
    } catch (err) {
      console.error("Failed to toggle read state:", err);
      // revert on failure
      setIsRead(!nextState);
    } finally {
      setIsMarkingRead(false);
    }
  };

  const handleDownload = () => {
    if (!note?.allow_download) return;
    if (fileUrl) {
      window.open(fileUrl, "_blank");
    } else {
      window.open(`/api/study-materials/${note.id}/file`, "_blank");
    }
  };

  // Structured content fallback
  const structured = note?.structured_content || {};
  const hasStructuredContent =
    structured.learning_objectives?.length > 0 ||
    structured.key_concepts?.length > 0 ||
    structured.detailed_notes ||
    note?.original_content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {note?.subject || "General"}
              </span>
              {note?.topic && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {note.topic}
                </span>
              )}
              {isRead ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  [Read Completed]
                </span>
              ) : (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  [Unread]
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 truncate">
              {note?.title || "Study Note"}
            </h2>
            <div className="text-[11px] text-slate-400">
              Uploaded by {note?.author_name || "Instructor"}
              {note?.created_at && (
                <span className="ml-2 text-slate-500">
                  &bull; {new Date(note.created_at).toLocaleDateString()}
                </span>
              )}
              {note?.file_size && (
                <span className="ml-2 text-slate-500">
                  &bull; {(note.file_size / (1024 * 1024)).toFixed(2)} MB
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Mark as Read Toggle */}
            <button
              onClick={handleToggleRead}
              disabled={isMarkingRead}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer border ${
                isRead
                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-600/50 hover:bg-emerald-900/50"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500"
              }`}
            >
              {isMarkingRead
                ? "Updating..."
                : isRead
                ? "Mark as Unread"
                : "Mark as Completed"}
            </button>

            {/* Conditional Download */}
            {note?.allow_download ? (
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                Download Note
              </button>
            ) : (
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-800/80 text-amber-300 border border-amber-500/30">
                View Only &mdash; Downloads Disabled
              </span>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-200 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#080c14]">
          {/* If Assignment One, show interactive chunked content tabs alongside PDF option */}
          {isAssignmentOne ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-indigo-200">
                    Interactive Study Module Available
                  </h3>
                  <p className="text-xs text-slate-400">
                    You can view the full formatted question paper and truth tables directly below, or preview the original PDF document.
                  </p>
                </div>
                {fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shrink-0"
                  >
                    Open PDF in New Window
                  </a>
                )}
              </div>

              {/* Interactive chunked assignment content */}
              <AssignmentOneContent />

              {/* Embedded PDF below for side-by-side or secondary verification */}
              {fileUrl && (
                <div className="pt-6 border-t border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-slate-300">
                    Original Document Preview
                  </h3>
                  <div className="w-full h-[650px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    <iframe
                      src={`${fileUrl}#toolbar=1&navpanes=0`}
                      title="Assignment Document"
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : isPdf ? (
            // PDF Document Viewer
            <div className="w-full h-full flex flex-col space-y-3">
              {isLoadingUrl ? (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                  Loading secure document preview...
                </div>
              ) : fileUrl ? (
                <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <iframe
                    src={`${fileUrl}#toolbar=1&navpanes=0`}
                    title={note?.title || "Document Preview"}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                  Document file could not be loaded.
                </div>
              )}
            </div>
          ) : isImage ? (
            // Image Preview (PNG / JPG)
            <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                >
                  Zoom Out
                </button>
                <span className="text-xs font-mono text-slate-400">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                >
                  Zoom In
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                >
                  Reset
                </button>
              </div>
              <div className="max-w-full overflow-auto p-4 rounded-xl border border-slate-800 bg-slate-950">
                <img
                  src={fileUrl || `/api/study-materials/${note.id}/file`}
                  alt={note?.title || "Note Image"}
                  style={{ width: `${zoomLevel}%` }}
                  className="max-w-none transition-all duration-150 rounded"
                />
              </div>
            </div>
          ) : isOfficeDoc ? (
            // Office Docs (DOCX / PPTX)
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4 p-8 text-center">
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 max-w-lg space-y-3">
                <h3 className="text-base font-bold text-slate-200">
                  {note?.file_name}
                </h3>
                <p className="text-xs text-slate-400">
                  Microsoft Office document ({note?.file_type || "DOCX/PPTX"}).
                </p>
                {note?.allow_download ? (
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    Download and Open in Office
                  </button>
                ) : (
                  <p className="text-xs text-amber-300 font-medium">
                    This file is marked as view-only by the instructor. Office documents require native download permission.
                  </p>
                )}
              </div>
            </div>
          ) : hasStructuredContent ? (
            // Structured Notes Text Reader
            <div className="max-w-4xl mx-auto space-y-6 text-slate-200">
              {note?.description && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <strong className="text-slate-100 block mb-1">Description:</strong>
                  {note.description}
                </div>
              )}

              {structured.learning_objectives?.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <h3 className="font-bold text-indigo-300">Learning Objectives</h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300">
                    {structured.learning_objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {structured.key_concepts?.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <h3 className="font-bold text-indigo-300">Key Concepts</h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300">
                    {structured.key_concepts.map((concept, i) => (
                      <li key={i}>{concept}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(structured.detailed_notes || note?.original_content) && (
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs leading-relaxed">
                  <h3 className="font-bold text-indigo-300">Detailed Notes</h3>
                  <div className="whitespace-pre-line text-slate-300">
                    {structured.detailed_notes || note.original_content}
                  </div>
                </div>
              )}

              {structured.important_points?.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <h3 className="font-bold text-amber-300">Important Points</h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300">
                    {structured.important_points.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}

              {structured.practice_questions?.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <h3 className="font-bold text-emerald-300">Practice Questions</h3>
                  <ul className="list-decimal pl-5 space-y-1.5 text-slate-300">
                    {structured.practice_questions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              No preview content available for this study note.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
