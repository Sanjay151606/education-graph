import { useState, useEffect, useCallback, useRef } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  Upload,
  FileText,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  CheckCircle,
  AlertCircle,
  FolderPlus,
  RefreshCw,
  Search,
  BookOpen,
  X,
  Check,
} from "lucide-react";
import MaterialViewer from "../components/study/MaterialViewer";

const SUBJECT_OPTIONS = [
  "Biology",
  "Computer Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "History",
  "English",
  "General",
];

const BAND_OPTIONS = [
  { value: "all", label: "All Learners (Universal)", icon: "🌐" },
  { value: "foundation", label: "Foundation Band (🥉 Beginner / Scaffolded)", icon: "🥉" },
  { value: "on_track", label: "On Track Band (🥈 Core Grade Level)", icon: "🥈" },
  { value: "advanced", label: "Advanced Band (🥇 High Depth / Extension)", icon: "🥇" },
];

export default function TeacherMaterials() {
  const { user } = useAuth();
  const teacherId = user?.id;

  // Form State
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Biology");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [targetBand, setTargetBand] = useState("all");
  const [contentType, setContentType] = useState("text"); // "text" | "file"
  const [originalContent, setOriginalContent] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [visibility, setVisibility] = useState("published");
  const [tagInput, setTagInput] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [searchFilter, setSearchFilter] = useState("");
  const [previewMaterial, setPreviewMaterial] = useState(null);

  // Edit Modal State
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fileInputRef = useRef(null);

  // 1. Fetch Teacher's Materials
  const fetchMaterials = useCallback(async () => {
    if (!teacherId) return;
    setIsLoadingList(true);
    try {
      const res = await api.get(`/study/materials/teacher/${teacherId}`);
      setMaterials(res.data || []);
    } catch (err) {
      console.error("Failed to load teacher materials:", err);
      // Fallback check on standard router if needed
      try {
        const fallbackRes = await api.get("/api/materials?visibility=my_materials");
        setMaterials(fallbackRes.data || []);
      } catch {
        setFeedback({ type: "error", message: "Failed to load uploaded materials." });
      }
    } finally {
      setIsLoadingList(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // 2. Handle Add / Publish Material
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFeedback({ type: "error", message: "Please enter a material title." });
      return;
    }

    if (contentType === "text" && !originalContent.trim()) {
      setFeedback({ type: "error", message: "Please enter study notes content." });
      return;
    }

    if (contentType === "file" && !uploadedFile) {
      setFeedback({ type: "error", message: "Please choose a PDF, DOCX, or text file to upload." });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: "", message: "" });

    try {
      const tagsList = tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (contentType === "file" && uploadedFile) {
        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("subject", subject);
        formData.append("topic", topic.trim());
        formData.append("description", description.trim());
        formData.append("target_band", targetBand);
        formData.append("knowledge_band_target", targetBand);
        formData.append("visibility", visibility);
        formData.append("tags", JSON.stringify(tagsList));
        formData.append("file", uploadedFile);

        await api.post("/study/materials", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const payload = {
          title: title.trim(),
          subject,
          topic: topic.trim(),
          description: description.trim(),
          target_band: targetBand,
          knowledge_band_target: targetBand,
          original_content: originalContent,
          visibility,
          tags: tagsList,
        };

        await api.post("/study/materials", payload);
      }

      setFeedback({
        type: "success",
        message: "🎉 Study material created and processed into student-ready format!",
      });

      // Reset form
      setTitle("");
      setTopic("");
      setDescription("");
      setOriginalContent("");
      setUploadedFile(null);
      setTagInput("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Refresh list
      fetchMaterials();
    } catch (err) {
      console.error("Create material error:", err);
      const errMsg = err.response?.data?.detail || "Failed to publish study material.";
      setFeedback({ type: "error", message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Toggle Visibility (Publish / Draft)
  const handleToggleVisibility = async (mat) => {
    const newVisibility = mat.visibility === "published" ? "draft" : "published";
    try {
      await api.put(`/study/materials/${mat.id}`, { visibility: newVisibility });
      setMaterials((prev) =>
        prev.map((m) => (m.id === mat.id ? { ...m, visibility: newVisibility } : m))
      );
    } catch (err) {
      console.error("Toggle visibility error:", err);
      alert("Failed to update visibility status.");
    }
  };

  // 4. Handle Delete Material
  const handleDelete = async (matId) => {
    if (!window.confirm("Are you sure you want to delete this study material?")) return;

    try {
      await api.delete(`/study/materials/${matId}`);
      setMaterials((prev) => prev.filter((m) => m.id !== matId));
      setFeedback({ type: "success", message: "Study material deleted." });
    } catch (err) {
      console.error("Delete material error:", err);
      alert("Failed to delete study material.");
    }
  };

  // 5. Handle Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingMaterial) return;

    setIsUpdating(true);
    try {
      const res = await api.put(`/study/materials/${editingMaterial.id}`, {
        title: editingMaterial.title,
        subject: editingMaterial.subject,
        topic: editingMaterial.topic,
        description: editingMaterial.description,
        target_band: editingMaterial.target_band || editingMaterial.knowledge_band_target,
        knowledge_band_target: editingMaterial.knowledge_band_target || editingMaterial.target_band,
        original_content: editingMaterial.original_content,
        visibility: editingMaterial.visibility,
      });

      setMaterials((prev) =>
        prev.map((m) => (m.id === editingMaterial.id ? res.data : m))
      );
      setEditingMaterial(null);
      setFeedback({ type: "success", message: "Study material updated successfully!" });
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update material.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter materials for search
  const filteredMaterials = materials.filter((m) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      m.title?.toLowerCase().includes(term) ||
      m.subject?.toLowerCase().includes(term) ||
      m.topic?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-150">
      {/* ── Page Title Header ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-brain-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">📚</span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Teacher Study Materials Portal
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-purple-100/90 max-w-xl">
              Publish structured notes and upload documents. Our AI automatically processes
              your content into student-ready ADHD chunked modules with progressive disclosure.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchMaterials}
              className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Feedback Alert ─────────────────────────────────────────────────── */}
      {feedback.message && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: "", message: "" })}
            className="text-slate-400 hover:text-slate-600 text-sm font-black cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Feature 1: Add New Material Form ─────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-black text-slate-900">Add New Study Material</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Supports Rich Text or PDF/DOCX Upload
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Title & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Material Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Cellular Respiration & ATP Production"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              >
                {SUBJECT_OPTIONS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Topic & Target Knowledge Band */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Topic / Unit Tag
              </label>
              <input
                type="text"
                placeholder="e.g., Cellular Biology / Energy Pathways"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Target Knowledge Band
              </label>
              <select
                value={targetBand}
                onChange={(e) => setTargetBand(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              >
                {BAND_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Short Description (optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Brief Overview / Objective (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Core lecture notes covering glycolysis, Krebs cycle, and oxidative phosphorylation."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          {/* Row 4: Content Input Mode Switcher */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-slate-700">
              Content Source Format <span className="text-rose-500">*</span>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setContentType("text")}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                  contentType === "text"
                    ? "bg-purple-50 text-purple-800 border-purple-300 ring-2 ring-purple-500/10"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Rich Text Entry (Notes & Bullets)</span>
              </button>

              <button
                type="button"
                onClick={() => setContentType("file")}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                  contentType === "file"
                    ? "bg-purple-50 text-purple-800 border-purple-300 ring-2 ring-purple-500/10"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload Document (PDF, DOCX, TXT)</span>
              </button>
            </div>

            {/* Input Body depending on contentType */}
            {contentType === "text" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Enter lecture notes, key terms, or transcript text below.</span>
                  <span>Markdown & bullet points supported</span>
                </div>
                <textarea
                  rows={8}
                  placeholder="Paste or type study notes here...&#10;&#10;Example:&#10;Cellular respiration is a set of metabolic reactions that convert nutrients into adenosine triphosphate (ATP)..."
                  value={originalContent}
                  onChange={(e) => setOriginalContent(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition leading-relaxed"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center space-y-3 bg-slate-50/50 hover:border-purple-300 transition">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto text-xl">
                    📄
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      {uploadedFile ? uploadedFile.name : "Choose a file to extract text from"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Supports PDF, DOCX (Word), and TXT files up to 25MB
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadedFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="teacher-file-upload"
                  />

                  <div>
                    <label
                      htmlFor="teacher-file-upload"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm shadow-purple-600/20 cursor-pointer transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadedFile ? "Change File" : "Select Document"}</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tags & Publishing Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                placeholder="biology, ATP, exam-prep, midterm"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Initial Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              >
                <option value="published">🚀 Published (Visible to enrolled students)</option>
                <option value="draft">🔒 Draft (Only visible to you)</option>
              </select>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-600/25 transition disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing & Generating Student Format…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>Publish Study Material</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Feature 1: Previous Uploads List (Edit / Delete / Unpublish) ────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Your Published & Draft Materials ({filteredMaterials.length})
            </h2>
            <p className="text-xs text-slate-500">
              Manage, edit, preview, or remove materials you have uploaded.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search your uploads…"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-4 py-2 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
        </div>

        {isLoadingList ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600" />
            <p className="text-xs font-semibold">Loading materials…</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl space-y-2">
            <p className="text-sm font-bold text-slate-700">No materials uploaded yet</p>
            <p className="text-xs text-slate-400">
              Use the form above to add your first study material or lecture document.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Title & Subject</th>
                  <th className="py-3 px-3">Target Band</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">AI Student Format</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredMaterials.map((mat) => {
                  const targetBandVal = mat.knowledge_band_target || mat.target_band || "all";
                  const isPublished = mat.visibility === "published";
                  const hasAIFormat = Boolean(mat.simplified_content);

                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/70 transition">
                      {/* Title & Subject */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5 max-w-sm">
                          <p className="font-bold text-slate-900 truncate">{mat.title}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-semibold text-purple-700">{mat.subject}</span>
                            {mat.topic && <span>• {mat.topic}</span>}
                            {(mat.source_file_name || mat.file_name) && (
                              <span className="flex items-center gap-0.5 text-slate-400">
                                📎 {mat.source_file_name || mat.file_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Band */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {targetBandVal}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPublished
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {isPublished ? "Published" : "Draft"}
                        </span>
                      </td>

                      {/* AI Format */}
                      <td className="py-3.5 px-3">
                        {hasAIFormat ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            Ready
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Raw only</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview / Read */}
                          <button
                            type="button"
                            onClick={() => setPreviewMaterial(mat)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-brain-700 hover:bg-slate-100 transition cursor-pointer"
                            title="Preview student format"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>

                          {/* Toggle publish / unpublish */}
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(mat)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isPublished
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-amber-600 hover:bg-amber-50"
                            }`}
                            title={isPublished ? "Unpublish (Make Draft)" : "Publish (Make Live)"}
                          >
                            {isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => setEditingMaterial(mat)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition cursor-pointer"
                            title="Edit details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(mat.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete material"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Edit Study Material</h3>
              <button
                onClick={() => setEditingMaterial(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Title</label>
                <input
                  type="text"
                  value={editingMaterial.title || ""}
                  onChange={(e) =>
                    setEditingMaterial({ ...editingMaterial, title: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Subject</label>
                  <select
                    value={editingMaterial.subject || "Biology"}
                    onChange={(e) =>
                      setEditingMaterial({ ...editingMaterial, subject: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700"
                  >
                    {SUBJECT_OPTIONS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Target Band</label>
                  <select
                    value={editingMaterial.knowledge_band_target || editingMaterial.target_band || "all"}
                    onChange={(e) =>
                      setEditingMaterial({
                        ...editingMaterial,
                        knowledge_band_target: e.target.value,
                        target_band: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700"
                  >
                    {BAND_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Topic / Tag</label>
                <input
                  type="text"
                  value={editingMaterial.topic || ""}
                  onChange={(e) =>
                    setEditingMaterial({ ...editingMaterial, topic: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Original Notes Content</label>
                <textarea
                  rows={5}
                  value={editingMaterial.original_content || ""}
                  onChange={(e) =>
                    setEditingMaterial({
                      ...editingMaterial,
                      original_content: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-sans text-slate-800 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── In-App Material Preview Modal ────────────────────────────────────── */}
      {previewMaterial && (
        <MaterialViewer
          material={previewMaterial}
          onClose={() => setPreviewMaterial(null)}
          onDownload={(mat) => {
            if (mat.file_path) {
              window.open(`/api/study-materials/${mat.id}/file`, "_blank");
            }
          }}
        />
      )}
    </div>
  );
}
