import React, { useState, useEffect, useCallback } from 'react';
import { Note } from '../../types/notes';
import {
  fetchNotes,
  deleteNote,
  toggleNoteStatus,
  getStudentProgressLocal,
  saveStudentProgress
} from '../../services/notesService';
import NoteCard from './NoteCard';
import NoteViewer from './NoteViewer';
import UploadNotesForm from './UploadNotesForm';

interface NotesListProps {
  userRole: string;
  user: { id: string; name?: string; full_name?: string } | null;
}

export default function NotesList({ userRole, user }: NotesListProps): React.ReactElement {
  const isTeacher = userRole === 'teacher' || userRole === 'admin';
  const currentUserId = user?.id || 'guest';
  const currentUserName = user?.full_name || user?.name || 'Instructor';

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [readMap, setReadMap] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string): void => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadAllNotes = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await fetchNotes(userRole, user?.id, 'CS-101');
      setNotes(data);

      const progressMap: Record<string, boolean> = {};
      data.forEach((n) => {
        const prog = getStudentProgressLocal(currentUserId, n.id);
        progressMap[n.id] = prog.is_read;
      });
      setReadMap(progressMap);
    } catch (err) {
      console.warn('Failed loading notes list:', err);
    } finally {
      setLoading(false);
    }
  }, [userRole, user?.id, currentUserId]);

  useEffect(() => {
    loadAllNotes();
  }, [loadAllNotes]);

  const handleToggleRead = async (noteId: string): Promise<void> => {
    const nextState = !readMap[noteId];
    setReadMap((prev) => ({ ...prev, [noteId]: nextState }));
    await saveStudentProgress(currentUserId, noteId, nextState, nextState ? 100 : 0);
    showToast(nextState ? 'Marked note as read.' : 'Marked note as unread.');
  };

  const handleToggleStatus = async (note: Note): Promise<void> => {
    try {
      const updatedStatus = await toggleNoteStatus(note.id, note.status);
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, status: updatedStatus } : n))
      );
      showToast(
        updatedStatus === 'published'
          ? 'Note published. Now visible to students.'
          : 'Note unpublished and saved as draft.'
      );
    } catch (err) {
      showToast('Failed to update note status.');
    }
  };

  const handleDelete = async (note: Note): Promise<void> => {
    try {
      await deleteNote(note.id, note.file_path);
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
      showToast('Note deleted successfully.');
    } catch {
      showToast('Failed to delete note.');
    }
  };

  const handleDownload = (note: Note): void => {
    if (!note.allow_download) {
      showToast('Downloads are disabled for this note.');
      return;
    }
    const a = document.createElement('a');
    a.href = note.file_path.includes('assignment_one')
      ? '/assignment_one_30_questions.pdf'
      : `/assignment_one_30_questions.pdf`;
    a.download = `${note.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Download started.');
  };

  // Distinct subjects
  const subjects = ['All', ...Array.from(new Set(notes.map((n) => n.subject).filter(Boolean)))];

  // Filtering
  const filteredNotes = notes.filter((n) => {
    // Subject filter
    if (selectedSubject !== 'All' && n.subject.toLowerCase() !== selectedSubject.toLowerCase()) {
      return false;
    }

    // Teacher draft/published filter
    if (isTeacher && teacherStatusFilter !== 'all' && n.status !== teacherStatusFilter) {
      return false;
    }

    // Student only sees published
    if (!isTeacher && n.status !== 'published') {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchSubject = n.subject.toLowerCase().includes(q);
      const matchUnit = n.unit.toLowerCase().includes(q);
      const matchDesc = n.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchSubject && !matchUnit && !matchDesc) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-100 shadow-2xl">
          {toastMessage}
        </div>
      )}

      {/* Header and Teacher Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-sky-400">
            Course Repository
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-slate-100">Class Notes & Documents</h2>
          <p className="text-xs text-slate-400 mt-1">
            {isTeacher
              ? 'Upload, publish, edit, and organize official study files for your classes.'
              : 'Official teacher-curated notes, workbooks, and study references for your enrolled class.'}
          </p>
        </div>

        {/* Teacher Upload Notes Button - Never visible to students */}
        {isTeacher && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingNote(null);
                setIsUploading(true);
              }}
              className="px-4 py-2.5 min-h-[44px] text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-colors"
            >
              Upload Notes
            </button>
          </div>
        )}
      </div>

      {/* Upload/Edit Modal/Inline Area */}
      {(isUploading || editingNote) && isTeacher && (
        <UploadNotesForm
          teacher={{ id: currentUserId, name: currentUserName }}
          initialNote={editingNote}
          onSuccess={(saved) => {
            setIsUploading(false);
            setEditingNote(null);
            setNotes((prev) => {
              const filtered = prev.filter((n) => n.id !== saved.id);
              return [saved, ...filtered];
            });
            showToast('Note saved successfully.');
          }}
          onCancel={() => {
            setIsUploading(false);
            setEditingNote(null);
          }}
        />
      )}

      {/* Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by title, unit, or topic..."
            className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Subject Filter & Teacher Status Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500"
          >
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub === 'All' ? 'All Subjects' : sub}
              </option>
            ))}
          </select>

          {/* Manage Notes Section filter - Teacher only */}
          {isTeacher && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTeacherStatusFilter('all')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  teacherStatusFilter === 'all'
                    ? 'bg-slate-800 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTeacherStatusFilter('published')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  teacherStatusFilter === 'published'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Published
              </button>
              <button
                type="button"
                onClick={() => setTeacherStatusFilter('draft')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  teacherStatusFilter === 'draft'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Drafts
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="w-20 h-4 bg-slate-800 rounded" />
                <div className="w-12 h-4 bg-slate-800 rounded" />
              </div>
              <div className="w-3/4 h-5 bg-slate-800 rounded" />
              <div className="w-full h-8 bg-slate-950 rounded" />
              <div className="w-full h-9 bg-slate-800 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredNotes.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
          <div className="text-sm font-semibold text-slate-300">No notes shared yet</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {isTeacher
              ? 'Click "Upload Notes" above to add the first assignment, workbook, or presentation for this class.'
              : 'Your instructors have not published any class notes for this section yet. Check back soon!'}
          </p>
        </div>
      )}

      {/* Responsive Grid: Mobile 1 col (375px), Laptop 2 col (768-1024px), Desktop 3-4 col (1440px) */}
      {!loading && filteredNotes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isTeacher={isTeacher}
              isRead={!!readMap[note.id]}
              onOpen={(n) => setViewingNote(n)}
              onToggleRead={handleToggleRead}
              onEdit={isTeacher ? (n) => setEditingNote(n) : undefined}
              onToggleStatus={isTeacher ? handleToggleStatus : undefined}
              onDelete={isTeacher ? handleDelete : undefined}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {/* In-App Document & Interactive Viewer Modal */}
      {viewingNote && (
        <NoteViewer
          note={viewingNote}
          isRead={!!readMap[viewingNote.id]}
          onClose={() => setViewingNote(null)}
          onToggleRead={handleToggleRead}
        />
      )}
    </div>
  );
}
