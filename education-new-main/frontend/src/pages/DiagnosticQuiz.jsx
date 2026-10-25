import { useState, useEffect } from "react";
import v2Api from "../services/v2_api";
import BandedMaterialViewer from "../components/v2/BandedMaterialViewer";

export default function DiagnosticQuiz() {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("cell-biology");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assignedBand, setAssignedBand] = useState(null);
  const [bandedMaterial, setBandedMaterial] = useState(null);
  const [loadingMaterial, setLoadingMaterial] = useState(false);

  // 1. Fetch available diagnostic topics
  useEffect(() => {
    v2Api.getTopics().then((res) => {
      setTopics(res);
      if (res && res.length > 0) {
        setSelectedTopic(res[0].topic_id);
      }
    }).catch(() => {
      setTopics([
        { topic_id: "cell-biology", topic_name: "Cellular Biology & Energy", question_count: 7 },
        { topic_id: "algebra-quadratics", topic_name: "Algebra & Quadratic Equations", question_count: 6 },
      ]);
    });
  }, []);

  // 2. Load Quiz when topic changes
  useEffect(() => {
    if (!selectedTopic) return;
    setLoading(true);
    setAnswers({});
    setAssignedBand(null);
    setBandedMaterial(null);

    // Check if student already has a band for this topic
    v2Api.getMyBand(selectedTopic).then((bandRecord) => {
      if (bandRecord) {
        setAssignedBand(bandRecord);
        fetchBandedMaterial(selectedTopic, bandRecord.topic_name);
      }
    }).catch(() => {});

    v2Api.getDiagnosticQuiz(selectedTopic).then((items) => {
      setQuizQuestions(items);
      setLoading(false);
    }).catch((e) => {
      console.warn("Quiz load error:", e);
      setLoading(false);
    });
  }, [selectedTopic]);

  const handleSelectOption = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    try {
      const currentTopicObj = topics.find((t) => t.topic_id === selectedTopic);
      const res = await v2Api.submitDiagnosticQuiz(
        selectedTopic,
        currentTopicObj?.topic_name || selectedTopic,
        answers
      );
      setAssignedBand(res);
      await fetchBandedMaterial(selectedTopic, res.topic_name);
    } catch (err) {
      console.warn("Error submitting quiz:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchBandedMaterial = async (topicId, topicName) => {
    setLoadingMaterial(true);
    try {
      const sampleOriginalText =
        "Cellular respiration is the biochemical process in which cells harvest energy stored in glucose. " +
        "It consists of three primary stages: Glycolysis in the cytosol, the Citric Acid (Krebs) Cycle in the mitochondrial matrix, " +
        "and Oxidative Phosphorylation via the electron transport chain across the inner mitochondrial membrane. " +
        "Overall, one glucose molecule yields approximately 30 to 32 ATP molecules through coupled redox reactions and proton gradient dynamics.";

      const res = await v2Api.getBandedMaterial(topicId, topicName, sampleOriginalText);
      setBandedMaterial(res);
    } catch (e) {
      console.warn("Could not fetch banded material:", e);
    } finally {
      setLoadingMaterial(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const isComplete = quizQuestions.length > 0 && answeredCount === quizQuestions.length;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <h1 className="text-2xl font-bold text-slate-900">Knowledge-Level Diagnostic & Banding</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Complete a short 5–8 question pre-check. Our algorithm automatically clusters your mastery into <span className="font-semibold text-blue-600">Foundation</span>, <span className="font-semibold text-emerald-600">On-Track</span>, or <span className="font-semibold text-purple-600">Advanced</span> to unlock tailored study pacing.
            </p>
          </div>

          {/* Topic Selector */}
          <div className="min-w-56">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Select Topic</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-brain-500"
            >
              {topics.map((t) => (
                <option key={t.topic_id} value={t.topic_id}>
                  {t.topic_name} ({t.question_count} Qs)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Existing Band Status if already completed */}
        {assignedBand && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Current Assigned Band:</span>
              <span className="px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] bg-brain-50 text-brain-700 border border-brain-200">
                {assignedBand.band} (Score: {assignedBand.score}%)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setAssignedBand(null);
                setBandedMaterial(null);
                setAnswers({});
              }}
              className="text-xs text-brain-600 hover:text-brain-700 font-semibold underline"
            >
              Retake Diagnostic Quiz
            </button>
          </div>
        )}
      </div>

      {/* Quiz Section (if not yet submitted or retaking) */}
      {!assignedBand && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Pre-Topic Diagnostic Questions ({answeredCount}/{quizQuestions.length})
            </h2>
            <div className="w-36 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-brain-500 h-full transition-all duration-300"
                style={{ width: `${quizQuestions.length > 0 ? (answeredCount / quizQuestions.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading diagnostic items...</div>
          ) : (
            <div className="space-y-6">
              {quizQuestions.map((item, qIdx) => (
                <div key={item.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-brain-700 font-mono">Question {qIdx + 1}</span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-0.5 rounded bg-white border border-slate-200">
                      {item.difficulty}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                    {item.question_text}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                    {item.options.map((opt, oIdx) => {
                      const isSelected = answers[item.id] === opt;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleSelectOption(item.id, opt)}
                          className={`text-left p-3 rounded-xl border text-xs font-medium transition flex items-center justify-between ${
                            isSelected
                              ? "bg-brain-500 text-white border-brain-600 shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <span>{opt}</span>
                          {isSelected && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!isComplete || submitting}
                  onClick={handleSubmitQuiz}
                  className="px-6 py-3 rounded-2xl bg-brain-600 hover:bg-brain-700 text-white font-bold text-sm shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? "Analyzing Knowledge Band..." : "Submit Diagnostic & Unlock Material 🚀"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Banded Study Material Showcase */}
      {assignedBand && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Unlocked Study Material for {assignedBand.topic_name}
            </h2>
            {loadingMaterial && (
              <span className="text-xs text-slate-400 animate-pulse">Adapting study depth...</span>
            )}
          </div>

          <BandedMaterialViewer material={bandedMaterial} />
        </div>
      )}
    </div>
  );
}
