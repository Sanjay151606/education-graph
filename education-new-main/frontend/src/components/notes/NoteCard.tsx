import React, { useState } from 'react';
import { Note } from '../../types/notes';

interface NoteCardProps {
  note: Note;
  isTeacher?: boolean;
  isRead?: boolean;
  onOpen?: (note: Note) => void;
  onView?: (note: Note) => void;
  onToggleRead?: (noteId: string, nextIsRead?: boolean) => void;
  onEdit?: (note: Note) => void;
  onToggleStatus?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  onDownload?: (note: Note) => void;
}

export default function NoteCard({
  note,
  isTeacher = false,
  isRead,
  onOpen,
  onView,
  onToggleRead,
  onEdit,
  onToggleStatus,
  onDelete,
  onDownload
}: NoteCardProps): React.ReactElement {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // If isRead is not explicitly passed, check note.is_read
  const readState = isRead !== undefined ? isRead : Boolean((note as unknown as { is_read?: boolean }).is_read);

  const formattedDate = note.uploaded_at
    ? new Date(note.uploaded_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Recent';

  const formatSize = (bytes: number): string => {
    if (!bytes) return '';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const getFormatLabel = (fileType: string): string => {
    if (!fileType) return 'Document';
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('word') || fileType.includes('docx')) return 'DOCX';
    if (fileType.includes('presentation') || fileType.includes('pptx')) return 'PPTX';
    if (fileType.includes('png')) return 'PNG';
    if (fileType.includes('jpeg') || fileType.includes('jpg')) return 'JPG';
    return 'Document';
  };

  const handleOpenClick = (): void => {
    if (onOpen) onOpen(note);
    else if (onView) onView(note);
  };

  const handleReadClick = (): void => {
    if (onToggleRead) {
      onToggleRead(note.id, !readState);
    }
  };

  return (
    <div className="flex flex-col justify-between p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors shadow-lg">
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sky-400 bg-sky-950/70 border border-sky-800/40 px-2.5 py-0.5 rounded-md">
              {note.subject}
            </span>
            <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md font-medium">
              {note.unit}
            </span>
            {note.class_id && (
              <span className="text-slate-500 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md font-mono">
                {note.class_id}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {readState ? (
              <span className="text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-md">
                Read
              </span>
            ) : (
              <span className="text-slate-500 bg-slate-950 px-2 py-0.5 rounded-md">
                Unread
              </span>
            )}

            {isTeacher && (
              <span
                className={`font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md text-[10px] ${
                  note.status === 'published'
                    ? 'text-emerald-300 bg-emerald-950 border border-emerald-800/40'
                    : 'text-amber-300 bg-amber-950 border border-amber-800/40'
                }`}
              >
                {note.status}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-100 line-clamp-2 leading-snug">
          {note.title}
        </h3>

        {/* Description */}
        {note.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {note.description}
          </p>
        )}

        {/* Metadata info */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-800/60">
          <span>By {note.teacher_name || 'Instructor'}</span>
          <span>
            {getFormatLabel(note.file_type || '')} {formatSize(note.size_bytes || 0) && `• ${formatSize(note.size_bytes || 0)}`}
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenClick}
            className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-colors text-center cursor-pointer"
          >
            Open
          </button>

          {onToggleRead && (
            <button
              type="button"
              onClick={handleReadClick}
              className={`py-2 px-3 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                readState
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300 hover:bg-emerald-900/50'
              }`}
            >
              {readState ? 'Mark Unread' : 'Mark as Read'}
            </button>
          )}

          {note.allow_download && onDownload && (
            <button
              type="button"
              onClick={() => onDownload(note)}
              className="py-2 px-3 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              Download
            </button>
          )}
        </div>

        {/* Teacher Controls */}
        {isTeacher && (
          <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(note)}
                  className="text-slate-400 hover:text-slate-200 underline font-medium cursor-pointer"
                >
                  Edit
                </button>
              )}
              {onToggleStatus && (
                <button
                  type="button"
                  onClick={() => onToggleStatus(note)}
                  className="text-sky-400 hover:text-sky-300 underline font-medium cursor-pointer"
                >
                  {note.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
              )}
            </div>

            {onDelete && (
              <div>
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-rose-400 hover:text-rose-300 underline font-medium cursor-pointer"
                  >
                    Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-rose-950/80 px-2 py-1 rounded border border-rose-800">
                    <span className="text-[11px] text-rose-200">Confirm?</span>
                    <button
                      type="button"
                      onClick={() => onDelete(note)}
                      className="text-[11px] font-bold text-rose-300 hover:underline cursor-pointer"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-[11px] text-slate-400 hover:underline cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="text-[10px] text-slate-600 text-right">
          Uploaded {formattedDate}
        </div>
      </div>
    </div>
  );
}
