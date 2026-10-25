import api from "../api/client";

export const v2Api = {
  // Knowledge Clustering
  getTopics: async () => {
    const res = await api.get("/api/v2/clustering/topics");
    return res.data;
  },

  getDiagnosticQuiz: async (topicId) => {
    const res = await api.get(`/api/v2/clustering/quiz/${topicId}`);
    return res.data;
  },

  submitDiagnosticQuiz: async (topicId, topicName, answers) => {
    const res = await api.post("/api/v2/clustering/submit-quiz", {
      topic_id: topicId,
      topic_name: topicName,
      answers,
    });
    return res.data;
  },

  getMyBand: async (topicId) => {
    const res = await api.get(`/api/v2/clustering/my-band/${topicId}`);
    return res.data;
  },

  getMyBands: async () => {
    const res = await api.get("/api/v2/clustering/my-bands");
    return res.data;
  },

  getBandedMaterial: async (topicId, topicName, originalText) => {
    const res = await api.post("/api/v2/clustering/banded-material", {
      topic_id: topicId,
      topic_name: topicName,
      original_text: originalText,
    });
    return res.data;
  },

  // Classroom Engagement & Bookmarks
  getClassSummary: async (sessionId) => {
    const res = await api.get(`/api/v2/engagement/summary/${sessionId}`);
    return res.data;
  },

  // Camera-derived engagement event (student → backend)
  postCameraEngagementEvent: async ({ session_id, state, confidence, timestamp }) => {
    const res = await api.post("/api/v2/engagement/event", {
      session_id,
      state,
      confidence,
      metadata_payload: { timestamp, source: "camera_engagement", onDeviceLocal: true },
    });
    return res.data;
  },

  // Teacher-authenticated class summary (camera + WebSocket aggregate)
  getTeacherClassSummary: async (sessionId) => {
    const res = await api.get(`/api/v2/engagement/class-summary/${sessionId}`);
    return res.data;
  },

  addConfusionBookmark: async (sessionId, topicOrSlide, note) => {
    const res = await api.post("/api/v2/classroom/confusion-bookmark", {
      session_id: sessionId,
      topic_or_slide: topicOrSlide,
      note,
    });
    return res.data;
  },

  getMyBookmarks: async (sessionId) => {
    const res = await api.get(`/api/v2/classroom/my-confusion-bookmarks/${sessionId}`);
    return res.data;
  },

  generateFollowup: async (sessionId) => {
    const res = await api.post(`/api/v2/classroom/generate-followup/${sessionId}`);
    return res.data;
  },

  getMyFollowups: async () => {
    const res = await api.get("/api/v2/classroom/my-followups");
    return res.data;
  },

  // ADHD Personalization
  getADHDProfile: async () => {
    const res = await api.get("/api/v2/adhd/profile");
    return res.data;
  },

  updateADHDProfile: async (updates) => {
    const res = await api.patch("/api/v2/adhd/profile", updates);
    return res.data;
  },

  analyzeFocusPattern: async () => {
    const res = await api.post("/api/v2/adhd/analyze-pattern");
    return res.data;
  },

  chunkLiveNotes: async (transcriptSnippet, topic) => {
    const res = await api.post("/api/v2/adhd/live-notes/chunk", {
      transcript_snippet: transcriptSnippet,
      topic,
    });
    return res.data;
  },

  // Session Recordings (Storage & Teacher Playback)
  startRecording: async (sessionId) => {
    const res = await api.post("/api/recordings/start", { session_id: sessionId });
    return res.data;
  },

  uploadRecordingChunk: async (recordingId, chunkIndex, blob) => {
    const formData = new FormData();
    formData.append("recording_id", recordingId);
    formData.append("chunk_index", chunkIndex);
    formData.append("file", blob, `chunk_${chunkIndex}.webm`);

    const res = await api.post("/api/recordings/chunk", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  completeRecording: async (recordingId, durationSeconds) => {
    const res = await api.post("/api/recordings/complete", {
      recording_id: recordingId,
      duration_seconds: durationSeconds,
    });
    return res.data;
  },

  getSessionRecordings: async (sessionId) => {
    const res = await api.get(`/api/recordings/list/${sessionId}`);
    return res.data;
  },

  getRecordingSignedUrl: async (recordingId) => {
    const res = await api.get(`/api/recordings/${recordingId}/signed-url`);
    return res.data;
  },

  // Study Materials (Teacher Upload/Authoring + Student Reading/Download)
  getStudyMaterials: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.subject && params.subject !== "All") query.append("subject", params.subject);
    if (params.material_type && params.material_type !== "All") query.append("material_type", params.material_type);
    if (params.search) query.append("search", params.search);
    if (params.visibility) query.append("visibility", params.visibility);

    const queryString = query.toString();
    const url = `/api/study-materials${queryString ? `?${queryString}` : ""}`;
    const res = await api.get(url);
    return res.data;
  },

  getStudyMaterialById: async (materialId) => {
    const res = await api.get(`/api/study-materials/${materialId}`);
    return res.data;
  },

  createStudyMaterial: async (materialData) => {
    const res = await api.post("/api/study-materials", materialData);
    return res.data;
  },

  uploadStudyMaterialFile: async (formData) => {
    const res = await api.post("/api/study-materials/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  updateStudyMaterial: async (materialId, updateData) => {
    const res = await api.put(`/api/study-materials/${materialId}`, updateData);
    return res.data;
  },

  deleteStudyMaterial: async (materialId) => {
    const res = await api.delete(`/api/study-materials/${materialId}`);
    return res.data;
  },

  togglePublishMaterial: async (materialId, visibility = null) => {
    const url = visibility
      ? `/api/study-materials/${materialId}/publish?visibility=${visibility}`
      : `/api/study-materials/${materialId}/publish`;
    const res = await api.patch(url);
    return res.data;
  },

  getMaterialSignedUrl: async (materialId) => {
    const res = await api.get(`/api/study-materials/${materialId}/signed-url`);
    return res.data;
  },
};

export default v2Api;

