/**
 * TeacherNotesManager.jsx
 *
 * Dedicated Teacher Notes Management module:
 * - "Upload Notes" Modal with drag-and-drop, progress bar, allowed extensions (.pdf, .docx, .pptx, .png, .jpg),
 *   50MB validation, "Allow students to download" toggle, and class/section targeting.
 * - "Manage Notes" Table / Cards with metadata edit, download toggle, delete confirmation, and read stats.
 * - Strict NO icons, NO emojis rule.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import v2Api from "../../services/v2_api";
import api from "../../api/client";

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".pptx", ".png", ".jpg", ".jpeg"];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

const SUBJECT_OPTIONS = [
  "Computer Science",
  "Mathematics",
  "Biology",
  "Physics",
  "Chemistry",
  "History",
  "English",
  "General",
];

export default function TeacherNotesManager({
  user,
  onNotesChanged,
  onViewNote,
}) {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSubject, setUploadSubject] = useState("Computer Science");
  const [uploadChapter, setUploadChapter] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadClassSection, setUploadClassSection] = useState("All Classes");
  const [uploadFile, setUploadFile] = useState(null);
  const [allowDownload, setAllowDownload] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Edit modal state
  const [editingNote, setEditingNote] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editChapter, setEditChapter] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAllowDownload, setEditAllowDownload] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete confirm state
  const [deletingId, setDeletingId] = useState(null);

  const fileInputRef = useRef(null);

  const fetchTeacherNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await v2Api.getStudyMaterials({ visibility: "my_materials" });
      setNotes(res || []);
    } catch (err) {
      console.warn("Falling back to full teacher notes query:", err);
      try {
        const fallback = await v2Api.getStudyMaterials();
        setNotes(fallback || []);
      } catch (e) {
        setFeedback({ type: "error", message: "Failed to load uploaded notes." });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeacherNotes();
  }, [fetchTeacherNotes]);

  // File validation
  const validateFile = (file) => {
    if (!file) return "Please choose a file to upload.";
    const name = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
    if (!hasValidExt) {
      return `Invalid file format. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File exceeds maximum limit of 50 MB (current: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`;
    }
    return null;
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const errorMsg = validateFile(file);
      if (errorMsg) {
        setFeedback({ type: "error", message: errorMsg });
        return;
      }
      setUploadFile(file);
      setFeedback({ type: "", message: "" });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const errorMsg = validateFile(file);
      if (errorMsg) {
        setFeedback({ type: "error", message: errorMsg });
        return;
      }
      setUploadFile(file);
      setFeedback({ type: "", message: "" });
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      setFeedback({ type: "error", message: "Note title is required." });
      return;
    }
    if (!uploadFile) {
      setFeedback({ type: "error", message: "Please select a note file (PDF, DOCX, PPTX, etc.)." });
      return;
    }

    const fileError = validateFile(uploadFile);
    if (fileError) {
      setFeedback({ type: "error", message: fileError });
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    setFeedback({ type: "", message: "" });

    try {
      const formData = new FormData();
      formData.append("title", uploadTitle.trim());
      formData.append("subject", uploadSubject);
      formData.append("topic", uploadChapter.trim());
      formData.append("description", uploadDescription.trim());
      formData.append("material_type", uploadFile.name.toLowerCase().endsWith(".pdf") ? "PDF" : "Notes");
      formData.append("visibility", "published");
      formData.append("allow_download", allowDownload ? "true" : "false");
      formData.append("tags_json", JSON.stringify([uploadClassSection, "TeacherNotes"]));
      formData.append("file", uploadFile);

      setUploadProgress(45);

      // Upload via api
      const res = await api.post("/api/study-materials/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(Math.min(95, Math.max(45, pct)));
          }
        },
      });

      setUploadProgress(100);
      setFeedback({ type: "success", message: "Note uploaded and published successfully." });

      // Reset form
      setUploadTitle("");
      setUploadChapter("");
      setUploadDescription("");
      setUploadFile(null);
      setAllowDownload(true);
      setIsUploadOpen(false);

      await fetchTeacherNotes();
      if (onNotesChanged) onNotesChanged();
    } catch (err) {
      console.error("Upload error:", err);
      setFeedback({
        type: "error",
        message: err.response?.data?.detail || "Failed to upload note. Please try again.",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setEditTitle(note.title || "");
    setEditSubject(note.subject || "General");
    setEditChapter(note.topic || "");
    setEditDescription(note.description || "");
    setEditAllowDownload(note.allow_download ?? true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingNote) return;
    setIsSavingEdit(true);
    try {
      await v2Api.updateStudyMaterial(editingNote.id, {
        title: editTitle.trim(),
        subject: editSubject,
        topic: editChapter.trim(),
        description: editDescription.trim(),
        allow_download: editAllowDownload,
      });

      setFeedback({ type: "success", message: "Note updated successfully." });
      setEditingNote(null);
      await fetchTeacherNotes();
      if (onNotesChanged) onNotesChanged();
    } catch (err) {
      console.error("Edit note error:", err);
      setFeedback({ type: "error", message: "Failed to update note metadata." });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggleDownloadPermission = async (note) => {
    const nextValue = !(note.allow_download ?? true);
    try {
      await v2Api.updateStudyMaterial(note.id, {
        allow_download: nextValue,
      });
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, allow_download: nextValue } : n))
      );
      if (onNotesChanged) onNotesChanged();
    } catch (err) {
      console.error("Toggle download error:", err);
    }
  };

  const handleDelete = async (noteId) => {
    try {
      await v2Api.deleteStudyMaterial(noteId);
      setFeedback({ type: "success", message: "Note deleted successfully." });
      setDeletingId(null);
      await fetchTeacherNotes();
      if (onNotesChanged) onNotesChanged();
    } catch (err) {
      console.error("Delete note error:", err);
      setFeedback({ type: "error", message: "Failed to delete note." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Teacher Action Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
            Instructor Portal
          </span>
          <h2 className="text-lg font-bold text-slate-100">
            Teacher Notes Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload lecture notes, chapter summaries, and manage student download permissions.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shrink-0"
        >
          Upload Notes
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback.message && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
            feedback.type === "error"
              ? "bg-rose-950/40 border-rose-800/80 text-rose-300"
              : "bg-emerald-950/40 border-emerald-800/80 text-emerald-300"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback({ type: "", message: "" })}
            className="text-slate-400 hover:text-slate-200 ml-4 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Notes Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Uploaded Notes ({notes.length})
          </h3>
          <button
            onClick={fetchTeacherNotes}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Refresh List
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Loading your uploaded notes...
          </div>
        ) : notes.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <p>You haven't uploaded any notes yet.</p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              Upload Your First Note
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Title &amp; Unit</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">File Details</th>
                  <th className="py-3 px-4">Download Permission</th>
                  <th className="py-3 px-4">Upload Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {notes.map((note) => {
                  const fileSizeStr = note.file_size
                    ? note.file_size > 1024 * 1024
                      ? `${(note.file_size / (1024 * 1024)).toFixed(1)} MB`
                      : `${Math.round(note.file_size / 1024)} KB`
                    : "Structured";

                  return (
                    <tr key={note.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100">{note.title}</div>
                        {note.topic && (
                          <div className="text-[11px] text-slate-400">Unit: {note.topic}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-medium">
                          {note.subject || "General"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] text-slate-300 truncate max-w-[150px]">
                          {note.file_name || "Note Content"}
                        </div>
                        <div className="text-[10px] text-slate-400">{fileSizeStr}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleDownloadPermission(note)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer border ${
                            note.allow_download ?? true
                              ? "bg-emerald-950/40 text-emerald-300 border-emerald-600/40 hover:bg-emerald-900/50"
                              : "bg-amber-950/40 text-amber-300 border-amber-600/40 hover:bg-amber-900/50"
                          }`}
                        >
                          {note.allow_download ?? true
                            ? "Allowed (Click to restrict)"
                            : "View Only (Click to allow)"}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {note.created_at
                          ? new Date(note.created_at).toLocaleDateString()
                          : "Recently"}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewNote && onViewNote(note)}
                            className="px-2 py-1 text-[11px] font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                          >
                            View
                          </button>

                          <button
                            onClick={() => openEditModal(note)}
                            className="px-2 py-1 text-[11px] font-bold rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => setDeletingId(note.id)}
                            className="px-2 py-1 text-[11px] font-bold rounded bg-slate-800 hover:bg-rose-900 hover:text-rose-200 text-rose-300 border border-slate-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h4 className="text-sm font-bold text-slate-100">
              Confirm Delete Note
            </h4>
            <p className="text-xs text-slate-400">
              Are you sure you want to permanently delete this note and its associated file? Students will no longer be able to access it.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-3 py-1.5 text-xs font-bold rounded bg-rose-600 hover:bg-rose-500 text-white"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Notes Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Upload Notes Document
                </h3>
                <p className="text-xs text-slate-400">
                  Share study notes, lecture PDFs, or presentation slides with students.
                </p>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="px-2.5 py-1 text-xs font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">
                  Note Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Number Systems &amp; Bitwise Operations"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Subject & Chapter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Subject</label>
                  <select
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {SUBJECT_OPTIONS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Unit / Chapter</label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 1: Digital Logic"
                    value={uploadChapter}
                    onChange={(e) => setUploadChapter(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Class / Section Audience */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Target Audience / Class</label>
                <input
                  type="text"
                  placeholder="e.g. All Classes or Grade 10-A"
                  value={uploadClassSection}
                  onChange={(e) => setUploadClassSection(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of topics covered in these notes..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* File Drop Area */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">
                  Select Note File <span className="text-rose-400">*</span>
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 rounded-xl border-2 border-dashed transition-colors text-center cursor-pointer ${
                    dragOver
                      ? "border-indigo-500 bg-indigo-950/20"
                      : uploadFile
                      ? "border-emerald-600/60 bg-emerald-950/10"
                      : "border-slate-800 hover:border-slate-700 bg-slate-950/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.pptx,.ppt,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {uploadFile ? (
                    <div className="space-y-1">
                      <div className="font-bold text-emerald-300">
                        {uploadFile.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready to upload
                      </div>
                      <div className="text-[10px] text-indigo-400 underline pt-1">
                        Click or drag to replace file
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-slate-400">
                      <div className="font-bold text-slate-300">
                        Drag and drop your file here, or click to browse
                      </div>
                      <div className="text-[11px]">
                        Supported: PDF, DOCX, PPTX, PNG, JPG (up to 50 MB)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Download Permission Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">
                    Allow Students to Download
                  </div>
                  <div className="text-[11px] text-slate-400">
                    If disabled, students can only view the note inside the app browser.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowDownload}
                    onChange={(e) => setAllowDownload(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Progress bar */}
              {isUploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Uploading note file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  {isUploading ? "Uploading..." : "Publish Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">
                Edit Note Details
              </h3>
              <p className="text-xs text-slate-400">
                Update note title, chapter, or download permission.
              </p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Subject</label>
                  <select
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {SUBJECT_OPTIONS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Unit / Chapter</label>
                  <input
                    type="text"
                    value={editChapter}
                    onChange={(e) => setEditChapter(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">
                    Allow Students to Download
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Current: {editAllowDownload ? "Download enabled" : "View only"}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editAllowDownload}
                    onChange={(e) => setEditAllowDownload(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
