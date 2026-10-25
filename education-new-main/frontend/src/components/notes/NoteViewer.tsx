import React, { useState, useEffect, useRef } from 'react';
import { Note } from '../../types/notes';
import { getSignedUrl } from '../../services/notesService';
import InteractiveAssignmentOne from './InteractiveAssignmentOne';

interface NoteViewerProps {
  note: Note;
  isRead?: boolean;
  onClose: () => void;
  onToggleRead?: (noteId: string, nextIsRead?: boolean) => void;
}

export default function NoteViewer({
  note,
  isRead,
  onClose,
  onToggleRead
}: NoteViewerProps): React.ReactElement {
  const readState = isRead !== undefined ? isRead : Boolean((note as unknown as { is_read?: boolean }).is_read);

  const isAssignmentOne =
    note.id === 'a1111111-1111-1111-1111-111111111111' ||
    (note.file_path && note.file_path.includes('assignment_one')) ||
    (note.title && note.title.toLowerCase().includes('assignment one'));

  const [activeTab, setActiveTab] = useState<'interactive' | 'document'>(
    isAssignmentOne ? 'interactive' : 'document'
  );
  const [signedUrl, setSignedUrl] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState<boolean>(true);
  const [fileError, setFileError] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const viewerContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadUrl() {
      setLoadingFile(true);
      setFileError('');
      try {
        const url = await getSignedUrl(note.file_path || 'seed/assignment_one_30_questions.pdf');
        if (isMounted) {
          setSignedUrl(url);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Unable to generate document signed URL.';
          setFileError(msg);
        }
      } finally {
        if (isMounted) setLoadingFile(false);
      }
    }
    loadUrl();
    return () => {
      isMounted = false;
    };
  }, [note.file_path]);

  const handleZoomIn = (): void => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = (): void => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = (): void => setZoomLevel(100);

  const toggleFullscreen = (): void => {
    if (!viewerContainerRef.current) return;
    if (!document.fullscreenElement) {
      viewerContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleDownload = (): void => {
    if (!signedUrl || !note.allow_download) return;
    const a = document.createElement('a');
    a.href = signedUrl;
    a.download = note.file_path ? note.file_path.split('/').pop() || 'document.pdf' : 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReadToggleClick = (): void => {
    if (onToggleRead) {
      onToggleRead(note.id, !readState);
    }
  };

  return (
    <div
      ref={viewerContainerRef}
      className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col backdrop-blur-md text-slate-100"
    >
      {/* Top Navigation Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 min-h-[44px] text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            Back to Notes
          </button>
          <div className="min-w-0">
            <h1 className="text-sm md:text-base font-bold text-slate-100 truncate">
              {note.title}
            </h1>
            <div className="text-xs text-slate-400">
              {note.subject} • {note.unit} {note.class_id && `• ${note.class_id}`}
            </div>
          </div>
        </div>

        {/* View Switcher for Seeded note */}
        {isAssignmentOne && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('interactive')}
              className={`px-3 py-1.5 min-h-[40px] text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'interactive'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Interactive Workbook
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('document')}
              className={`px-3 py-1.5 min-h-[40px] text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'document'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Original Document
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {onToggleRead && (
            <button
              type="button"
              onClick={handleReadToggleClick}
              className={`px-3 py-1.5 min-h-[44px] text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                readState
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/80'
              }`}
            >
              {readState ? 'Mark as Unread' : 'Mark as Read'}
            </button>
          )}

          {note.allow_download && (
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 min-h-[44px] text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              Download File
            </button>
          )}

          {activeTab === 'document' && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={handleZoomOut}
                className="px-2 py-1 text-xs text-slate-300 hover:text-white cursor-pointer"
                title="Zoom Out"
              >
                Zoom -
              </button>
              <span className="text-[11px] font-mono px-1.5 text-slate-400">{zoomLevel}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="px-2 py-1 text-xs text-slate-300 hover:text-white cursor-pointer"
                title="Zoom In"
              >
                Zoom +
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Reset
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden md:inline-block px-3 py-1.5 min-h-[44px] text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </header>

      {/* Main Body View */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full">
        {activeTab === 'interactive' && isAssignmentOne ? (
          <InteractiveAssignmentOne />
        ) : (
          <div className="h-full flex flex-col space-y-4">
            {loadingFile && (
              <div className="h-96 flex flex-col items-center justify-center space-y-3 bg-slate-900 rounded-2xl border border-slate-800">
                <div className="text-xs font-semibold text-slate-400 animate-pulse">
                  Loading secure document signed URL...
                </div>
                <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full w-2/3 animate-pulse" />
                </div>
              </div>
            )}

            {fileError && (
              <div className="p-6 rounded-2xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200 space-y-2">
                <div className="font-bold">Error loading document:</div>
                <div>{fileError}</div>
                <div className="text-slate-400">
                  Please verify that you are logged in with valid permissions to access this class document.
                </div>
              </div>
            )}

            {!loadingFile && !fileError && signedUrl && (
              <div className="flex-1 min-h-[75vh] rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl flex flex-col">
                <div className="p-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Document Previewer • Short-lived signed URL (10m)</span>
                  <span>Zoom scale: {zoomLevel}%</span>
                </div>
                <div className="flex-1 w-full overflow-auto bg-slate-950">
                  <iframe
                    src={`${signedUrl}#view=FitH`}
                    title={note.title}
                    className="w-full h-full min-h-[70vh] border-0"
                    style={{
                      transform: `scale(${zoomLevel / 100})`,
                      transformOrigin: 'top center'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
