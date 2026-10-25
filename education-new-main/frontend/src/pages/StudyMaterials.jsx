/**
 * StudyMaterials.jsx
 *
 * Notes & Study Materials Page:
 * - Teacher: Upload Notes modal and Manage Notes dashboard (strictly visible only to teachers/admins)
 * - Student: Browse and search teacher-uploaded notes with subject, unit/chapter, and author filters
 * - Progress tracking: completed notes counter and visual progress bar per subject
 * - NoteViewer modal: in-browser PDF iframe, image preview, office document viewer, and Assignment One interactive module
 * - Conditional download: only enabled if allow_download is true
 * - Dark theme styling matching the application (#0b0f19, border-slate-800, text-slate-100)
 * - Strict NO icons, NO emojis rule.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import v2Api from "../services/v2_api";
import NoteCard from "../components/notes/NoteCard";
import NoteViewer from "../components/notes/NoteViewer";
import TeacherNotesManager from "../components/notes/TeacherNotesManager";
import UploadNotesForm from "../components/notes/UploadNotesForm";
import { fetchNotes as fetchNotesService, saveStudentProgress } from "../services/notesService";

const SUBJECT_OPTIONS = [
  "All",
  "Computer Science",
  "Mathematics",
  "Biology",
  "Physics",
  "Chemistry",
  "History",
  "English",
  "General",
];

export default function StudyMaterials() {
  const { user, role } = useAuth();
  const currentRole = (role || user?.role || "student").toLowerCase();
  const isTeacher = currentRole === "teacher" || currentRole === "admin";

  // Tab state for teacher
  const [activeView, setActiveView] = useState("student"); // "student" | "teacher_manage"
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Notes data state
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedChapter, setSelectedChapter] = useState("All");
  const [selectedAuthor, setSelectedAuthor] = useState("All");
  const [readFilter, setReadFilter] = useState("all"); // "all" | "unread" | "completed"

  // Selected note for viewer modal
  const [selectedNote, setSelectedNote] = useState(null);

  // Fetch notes via notesService with fallback
  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await fetchNotesService(currentRole, user?.id, "CS-101");
      setNotes(data || []);
    } catch (err) {
      console.warn("Direct fetchNotesService error, trying API fallback:", err);
      try {
        const data = await v2Api.getStudyMaterials();
        setNotes(data || []);
      } catch (fallbackErr) {
        setErrorMessage("Unable to load study notes. Please check connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentRole, user?.id]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Handle note read state toggled
  const handleNoteReadToggled = async (noteId, nextIsRead) => {
    setNotes((prevNotes) =>
      prevNotes.map((n) =>
        n.id === noteId ? { ...n, is_read: nextIsRead } : n
      )
    );
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote((prev) => (prev ? { ...prev, is_read: nextIsRead } : null));
    }
    if (user?.id) {
      await saveStudentProgress(user.id, noteId, nextIsRead);
    }
  };

  // Derive unique unit/chapters and teachers for filters
  const availableChapters = useMemo(() => {
    const chapters = new Set();
    notes.forEach((n) => {
      if (n.topic && n.topic.trim()) chapters.add(n.topic.trim());
    });
    return ["All", ...Array.from(chapters)];
  }, [notes]);

  const availableAuthors = useMemo(() => {
    const authors = new Set();
    notes.forEach((n) => {
      if (n.author_name && n.author_name.trim()) authors.add(n.author_name.trim());
    });
    return ["All", ...Array.from(authors)];
  }, [notes]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Subject filter
      if (
        selectedSubject !== "All" &&
        note.subject?.toLowerCase() !== selectedSubject.toLowerCase()
      ) {
        return false;
      }

      // Chapter filter
      if (
        selectedChapter !== "All" &&
        note.topic?.toLowerCase() !== selectedChapter.toLowerCase()
      ) {
        return false;
      }

      // Author filter
      if (
        selectedAuthor !== "All" &&
        note.author_name?.toLowerCase() !== selectedAuthor.toLowerCase()
      ) {
        return false;
      }

      // Read status filter
      if (readFilter === "unread" && note.is_read) {
        return false;
      }
      if (readFilter === "completed" && !note.is_read) {
        return false;
      }

      // Keyword search across title, chapter, description, and author
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = note.title?.toLowerCase().includes(query);
        const inChapter = note.topic?.toLowerCase().includes(query);
        const inDesc = note.description?.toLowerCase().includes(query);
        const inAuthor = note.author_name?.toLowerCase().includes(query);
        const inSubject = note.subject?.toLowerCase().includes(query);
        if (!inTitle && !inChapter && !inDesc && !inAuthor && !inSubject) {
          return false;
        }
      }

      return true;
    });
  }, [notes, selectedSubject, selectedChapter, selectedAuthor, readFilter, searchQuery]);

  // Calculate completion progress
  const totalNotesCount = notes.length;
  const completedNotesCount = notes.filter((n) => n.is_read).length;
  const progressPercent = totalNotesCount > 0 ? Math.round((completedNotesCount / totalNotesCount) * 100) : 0;

  const subjectProgress = useMemo(() => {
    if (selectedSubject === "All") return null;
    const subjectNotes = notes.filter(
      (n) => n.subject?.toLowerCase() === selectedSubject.toLowerCase()
    );
    const count = subjectNotes.length;
    const completed = subjectNotes.filter((n) => n.is_read).length;
    const pct = count > 0 ? Math.round((completed / count) * 100) : 0;
    return { count, completed, pct };
  }, [notes, selectedSubject]);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Top Header */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                  Academic Repository
                </span>
                {isTeacher && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Teacher Mode
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-100">
                Course Notes &amp; Study Materials
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                Browse verified teacher notes, unit chapters, and interactive assignments.
                Track your reading progress and view documents directly in your browser.
              </p>
            </div>

            {/* Action Bar (Teacher actions only visible to teacher) */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {isTeacher && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Upload Notes
                  </button>

                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
                    <button
                      onClick={() => setActiveView("student")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        activeView === "student"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Student Notes View
                    </button>
                    <button
                      onClick={() => setActiveView("teacher_manage")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        activeView === "teacher_manage"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Manage Notes
                    </button>
                  </div>
                </>
              )}

              <button
                onClick={fetchNotes}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-bold transition cursor-pointer"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Progress Tracker (Student View) */}
          {activeView === "student" && totalNotesCount > 0 && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">
                  {selectedSubject !== "All"
                    ? `${selectedSubject} Notes Completed:`
                    : "Overall Notes Completed:"}
                </span>
                <span className="font-mono text-indigo-300 font-bold">
                  {subjectProgress
                    ? `${subjectProgress.completed} of ${subjectProgress.count} (${subjectProgress.pct}%)`
                    : `${completedNotesCount} of ${totalNotesCount} (${progressPercent}%)`}
                </span>
              </div>
              <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-300"
                  style={{
                    width: `${subjectProgress ? subjectProgress.pct : progressPercent}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Filter Bar (Student View) */}
          {activeView === "student" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              {/* Search */}
              <div className="lg:col-span-1">
                <input
                  type="text"
                  placeholder="Search notes, chapters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Subject */}
              <div>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  {SUBJECT_OPTIONS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub === "All" ? "All Subjects" : sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit / Chapter */}
              <div>
                <select
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  {availableChapters.map((ch) => (
                    <option key={ch} value={ch}>
                      {ch === "All" ? "All Units / Chapters" : ch}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher */}
              <div>
                <select
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  {availableAuthors.map((author) => (
                    <option key={author} value={author}>
                      {author === "All" ? "All Instructors" : author}
                    </option>
                  ))}
                </select>
              </div>

              {/* Read Status Toggle */}
              <div>
                <select
                  value={readFilter}
                  onChange={(e) => setReadFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Notes</option>
                  <option value="unread">Unread Only</option>
                  <option value="completed">Completed Only</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs font-medium flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={fetchNotes}
              className="text-rose-200 underline font-bold cursor-pointer ml-4"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ================= TEACHER MANAGE VIEW ================= */}
        {isTeacher && activeView === "teacher_manage" ? (
          <TeacherNotesManager
            user={user}
            onNotesChanged={fetchNotes}
            onViewNote={(note) => setSelectedNote(note)}
          />
        ) : (
          /* ================= STUDENT NOTES VIEW ================= */
          <div className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="p-8 text-center bg-[#0b0f19] rounded-2xl border border-slate-800">
                  <p className="text-xs font-bold text-slate-400">
                    Loading course notes...
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-[#0b0f19] rounded-xl border border-slate-800 p-5 space-y-4 animate-pulse"
                    >
                      <div className="h-4 bg-slate-800 rounded w-1/3" />
                      <div className="h-5 bg-slate-800 rounded w-3/4" />
                      <div className="h-12 bg-slate-850 rounded w-full" />
                      <div className="h-8 bg-slate-800 rounded w-full" />
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  No Notes Found
                </span>
                <h2 className="text-base font-bold text-slate-200">
                  No notes shared yet. Check back soon!
                </h2>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {searchQuery ||
                  selectedSubject !== "All" ||
                  selectedChapter !== "All" ||
                  selectedAuthor !== "All" ||
                  readFilter !== "all"
                    ? "No notes matched your filters. Try clearing or relaxing your search criteria."
                    : "Your instructors haven't uploaded notes for this section yet."}
                </p>
                {(searchQuery ||
                  selectedSubject !== "All" ||
                  selectedChapter !== "All" ||
                  selectedAuthor !== "All" ||
                  readFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedSubject("All");
                      setSelectedChapter("All");
                      setSelectedAuthor("All");
                      setReadFilter("all");
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onView={(n) => setSelectedNote(n)}
                    onToggleRead={handleNoteReadToggled}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* In-App Note Viewer Modal */}
        {selectedNote && (
          <NoteViewer
            note={selectedNote}
            isRead={selectedNote.is_read}
            onClose={() => setSelectedNote(null)}
            onToggleRead={handleNoteReadToggled}
          />
        )}

        {/* Teacher Upload Notes Modal */}
        {isUploadOpen && isTeacher && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-2xl w-full my-8">
              <UploadNotesForm
                teacher={{
                  id: user?.id || "teacher_default",
                  name: user?.full_name || user?.name || "Faculty Instructor"
                }}
                onSuccess={(savedNote) => {
                  setIsUploadOpen(false);
                  fetchNotes();
                }}
                onCancel={() => setIsUploadOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
