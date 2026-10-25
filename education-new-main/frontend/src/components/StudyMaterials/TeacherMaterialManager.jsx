/**
 * TeacherMaterialManager.jsx
 *
 * Comprehensive Teacher Study Materials Management:
 * - List materials with filters (all / published / draft)
 * - Add New Material modal (structured notes + document file uploads to private Supabase Storage)
 * - Edit Material modal
 * - Delete Material with confirmation
 * - Publish / Draft visibility toggle
 * - Instant in-app reader preview
 */

import { useState, useEffect, useCallback } from "react";
import v2Api from "../../services/v2_api";
import MaterialReaderModal from "./MaterialReaderModal";

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

const MATERIAL_TYPE_OPTIONS = [
  "Notes",
  "PDF",
  "Document",
  "Presentation",
  "Video",
  "Link",
  "Question Set",
  "Study Guide",
];

export default function TeacherMaterialManager() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterVisibility, setFilterVisibility] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [deletingMaterial, setDeletingMaterial] = useState(null);
  const [previewMaterial, setPreviewMaterial] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    subject: "Biology",
    topic: "",
    description: "",
    material_type: "Notes",
    visibility: "published",
    tags: "",
    learning_objectives: "",
    key_concepts: "",
    detailed_notes: "",
    important_points: "",
    quick_revision: "",
    practice_questions: "",
    file: null,
  });

  // 1. Fetch materials
  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await v2Api.getStudyMaterials({
        subject: filterSubject,
        search: searchQuery,
        visibility: filterVisibility === "All" ? undefined : filterVisibility,
      });
      setMaterials(data || []);
    } catch (err) {
      console.error("Error fetching study materials:", err);
      setError("Unable to load study materials. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filterSubject, filterVisibility, searchQuery]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // 2. Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      title: "",
      subject: "Biology",
      topic: "",
      description: "",
      material_type: "Notes",
      visibility: "published",
      tags: "",
      learning_objectives: "",
      key_concepts: "",
      detailed_notes: "",
      important_points: "",
      quick_revision: "",
      practice_questions: "",
      file: null,
    });
    setEditingMaterial(null);
    setShowAddModal(true);
  };

  // 3. Open Edit Modal
  const handleOpenEdit = (mat) => {
    const struct = mat.structured_content || {};
    setFormData({
      title: mat.title || "",
      subject: mat.subject || "Biology",
      topic: mat.topic || "",
      description: mat.description || "",
      material_type: mat.material_type || "Notes",
      visibility: mat.visibility || "published",
      tags: (mat.tags || []).join(", "),
      learning_objectives: (struct.learning_objectives || []).join("\n"),
      key_concepts: (struct.key_concepts || []).join("\n"),
      detailed_notes: struct.detailed_notes || mat.original_content || mat.original_text || "",
      important_points: (struct.important_points || []).join("\n"),
      quick_revision: struct.quick_revision || "",
      practice_questions: (struct.practice_questions || []).join("\n"),
      file: null,
    });
    setEditingMaterial(mat);
    setShowAddModal(true);
  };

  // 4. Submit Add / Edit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const parsedTags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const structuredContent = {
        learning_objectives: formData.learning_objectives.split("\n").map((s) => s.trim()).filter(Boolean),
        key_concepts: formData.key_concepts.split("\n").map((s) => s.trim()).filter(Boolean),
        detailed_notes: formData.detailed_notes,
        important_points: formData.important_points.split("\n").map((s) => s.trim()).filter(Boolean),
        quick_revision: formData.quick_revision,
        practice_questions: formData.practice_questions.split("\n").map((s) => s.trim()).filter(Boolean),
      };

      if (editingMaterial) {
        // Edit mode (PUT)
        await v2Api.updateStudyMaterial(editingMaterial.id, {
          title: formData.title,
          subject: formData.subject,
          topic: formData.topic,
          description: formData.description,
          material_type: formData.material_type,
          visibility: formData.visibility,
          tags: parsedTags,
          structured_content: structuredContent,
          original_content: formData.detailed_notes,
        });
      } else if (formData.file) {
        // Multipart upload mode
        const formPayload = new FormData();
        formPayload.append("title", formData.title);
        formPayload.append("subject", formData.subject);
        formPayload.append("topic", formData.topic);
        formPayload.append("description", formData.description);
        formPayload.append("material_type", formData.material_type || "PDF");
        formPayload.append("visibility", formData.visibility);
        formPayload.append("tags_json", JSON.stringify(parsedTags));
        formPayload.append("structured_content_json", JSON.stringify(structuredContent));
        formPayload.append("file", formData.file);

        await v2Api.uploadStudyMaterialFile(formPayload);
      } else {
        // Standard JSON create
        await v2Api.createStudyMaterial({
          title: formData.title,
          subject: formData.subject,
          topic: formData.topic,
          description: formData.description,
          material_type: formData.material_type,
          visibility: formData.visibility,
          tags: parsedTags,
          structured_content: structuredContent,
          original_content: formData.detailed_notes,
        });
      }

      setShowAddModal(false);
      setEditingMaterial(null);
      fetchMaterials();
    } catch (err) {
      console.error("Save material error:", err);
      setError(err?.response?.data?.detail || "Failed to save study material.");
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Toggle Publish
  const handleTogglePublish = async (mat) => {
    try {
      const nextVis = mat.visibility === "published" ? "draft" : "published";
      await v2Api.togglePublishMaterial(mat.id, nextVis);
      fetchMaterials();
    } catch (err) {
      console.error("Toggle publish error:", err);
      setError("Failed to update material visibility.");
    }
  };

  // 6. Delete Material
  const handleDeleteConfirm = async () => {
    if (!deletingMaterial) return;
    try {
      await v2Api.deleteStudyMaterial(deletingMaterial.id);
      setDeletingMaterial(null);
      fetchMaterials();
    } catch (err) {
      console.error("Delete material error:", err);
      setError("Failed to delete study material.");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Section Header ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📚</span>
              <h2 className="text-xl font-bold text-slate-900">Study Materials Management</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Create structured learning notes and upload documents to private storage for your students.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-brain-600 hover:bg-brain-700 text-white text-xs font-bold shadow-sm shadow-brain-600/20 transition shrink-0"
          >
            <span>+</span>
            <span>Add New Material</span>
          </button>
        </div>

        {/* ── Filters & Search ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search materials by title, topic, or tags…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500 transition"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
          >
            <option value="All">All Subjects</option>
            {SUBJECT_OPTIONS.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

          {/* Visibility Filter */}
          <select
            value={filterVisibility}
            onChange={(e) => setFilterVisibility(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
          >
            <option value="All">All Visibility</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      {/* ── Error Banner ───────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError("")} className="text-rose-600 hover:text-rose-900 font-bold ml-2">✕</button>
        </div>
      )}

      {/* ── Materials Table / List ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <span className="text-3xl animate-spin inline-block">⏳</span>
            <p className="text-xs font-semibold text-slate-500">Loading study materials…</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <span className="text-4xl">📂</span>
            <h3 className="text-sm font-bold text-slate-800">No Study Materials Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't created any materials matching these filters yet. Click below to add your first study guide or note.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-brain-50 text-brain-700 hover:bg-brain-100 text-xs font-bold transition"
            >
              + Create First Material
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-bold">
                  <th className="py-3.5 px-5">Material</th>
                  <th className="py-3.5 px-4">Subject & Topic</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 text-sm">{m.title}</div>
                      {m.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 max-w-xs">
                          {m.description}
                        </p>
                      )}
                      {m.file_name && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-indigo-600 font-medium">
                          📎 {m.file_name}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-800">{m.subject}</span>
                      {m.topic && <div className="text-[11px] text-slate-400">{m.topic}</div>}
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {m.material_type || "Notes"}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(m)}
                        title="Click to toggle publish/draft"
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                          m.visibility === "published"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        }`}
                      >
                        {m.visibility === "published" ? "● Published" : "○ Draft"}
                      </button>
                    </td>

                    <td className="py-4 px-4 text-slate-400 text-[11px]">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                    </td>

                    <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setPreviewMaterial(m)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold transition"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(m)}
                        className="px-2.5 py-1 rounded-lg border border-brain-200 text-brain-700 hover:bg-brain-50 font-semibold transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingMaterial(m)}
                        className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Material Modal ──────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brain-50 text-brain-600 flex items-center justify-center text-xl">
                  {editingMaterial ? "✏️" : "📚"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingMaterial ? "Edit Study Material" : "Create New Study Material"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingMaterial ? "Update content and visibility" : "Author notes or upload document files"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* Row 1: Title & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Material Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cellular Respiration & ATP"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Subject *</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
                  >
                    {SUBJECT_OPTIONS.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Topic & Material Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-slate-700">Topic / Chapter</label>
                  <input
                    type="text"
                    placeholder="e.g. Energy Pathways & Glycolysis"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Material Type *</label>
                  <select
                    value={formData.material_type}
                    onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
                  >
                    {MATERIAL_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Description / Overview</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of what this study guide covers…"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
                />
              </div>

              {/* File Upload (Optional) */}
              <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span>📎</span>
                  <span>Document File Upload (PDF, DOCX, PPTX, TXT)</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Files are securely stored in private Supabase Storage and served via short-lived signed URLs.
                </p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brain-50 file:text-brain-700 hover:file:bg-brain-100 cursor-pointer"
                />
              </div>

              {/* Structured Notes Content Sections */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>📝</span>
                  <span>Ready-To-Use Structured Notes</span>
                </h4>

                {/* Detailed Notes */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Detailed Notes & Content</label>
                  <textarea
                    rows={6}
                    placeholder="1. Introduction&#10;Cellular respiration is the process...&#10;&#10;2. Glycolysis&#10;Glycolysis occurs in the cytoplasm..."
                    value={formData.detailed_notes}
                    onChange={(e) => setFormData({ ...formData, detailed_notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
                  />
                </div>

                {/* Learning Objectives */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Learning Objectives (1 per line)</label>
                  <textarea
                    rows={3}
                    placeholder="Understand glycolysis pathway&#10;Explain Krebs cycle in mitochondria&#10;Describe ATP production"
                    value={formData.learning_objectives}
                    onChange={(e) => setFormData({ ...formData, learning_objectives: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
                  />
                </div>

                {/* Key Concepts */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Key Concepts (1 per line)</label>
                  <textarea
                    rows={2}
                    placeholder="Glycolysis&#10;Krebs Cycle&#10;Electron Transport Chain&#10;ATP Synthase"
                    value={formData.key_concepts}
                    onChange={(e) => setFormData({ ...formData, key_concepts: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
                  />
                </div>

                {/* Quick Revision & Important Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Quick Revision Summary</label>
                    <textarea
                      rows={3}
                      placeholder="Summary points for rapid pre-exam recall…"
                      value={formData.quick_revision}
                      onChange={(e) => setFormData({ ...formData, quick_revision: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Important Points (1 per line)</label>
                    <textarea
                      rows={3}
                      placeholder="Glycolysis yields net 2 ATP&#10;Oxygen acts as the terminal electron acceptor"
                      value={formData.important_points}
                      onChange={(e) => setFormData({ ...formData, important_points: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
                    />
                  </div>
                </div>

                {/* Practice Questions */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Practice / Review Questions (1 per line)</label>
                  <textarea
                    rows={3}
                    placeholder="Where does glycolysis occur in the cell?&#10;What is the net ATP output of aerobic respiration?&#10;How does NADH contribute to ATP synthesis?"
                    value={formData.practice_questions}
                    onChange={(e) => setFormData({ ...formData, practice_questions: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
                  />
                </div>
              </div>

              {/* Tags & Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="biology, respiration, ATP, energy"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Visibility Status</label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
                  >
                    <option value="published">Published (Visible to students)</option>
                    <option value="draft">Draft (Hidden from students)</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-brain-600 hover:bg-brain-700 text-white font-bold transition shadow-md shadow-brain-600/20 disabled:opacity-50"
                >
                  {submitting ? "Saving…" : editingMaterial ? "Save Changes" : "Create Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      {deletingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mx-auto">
              🗑️
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Study Material?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong>"{deletingMaterial.title}"</strong>?
                This will permanently remove the material and its stored files.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMaterial(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── In-App Material Reader Preview Modal ────────────────────────────── */}
      {previewMaterial && (
        <MaterialReaderModal
          material={previewMaterial}
          onClose={() => setPreviewMaterial(null)}
        />
      )}
    </div>
  );
}
