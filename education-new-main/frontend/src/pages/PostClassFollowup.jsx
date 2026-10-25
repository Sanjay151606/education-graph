import { useState, useEffect } from "react";
import v2Api from "../services/v2_api";

export default function PostClassFollowup() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState("class-bio-101");
  const [generating, setGenerating] = useState(false);

  const fetchFollowups = async () => {
    setLoading(true);
    try {
      const list = await v2Api.getMyFollowups();
      setFollowups(list);
    } catch (e) {
      console.warn("Could not fetch followups:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, []);

  const handleGenerateNow = async () => {
    setGenerating(true);
    try {
      await v2Api.generateFollowup(selectedSessionId);
      await fetchFollowups();
    } catch (err) {
      console.warn("Followup generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📬</span>
            <h1 className="text-2xl font-bold text-slate-900">Post-Class Personalized Follow-Up</h1>
          </div>
          <p className="text-xs text-slate-500">
            Tailored specifically to your live engagement. Struggled with a concept? Get a crystal-clear 2-minute recap. Stayed focused? Stretch your mastery with extension challenges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Session Code"
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="w-36 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brain-500"
          />
          <button
            type="button"
            disabled={generating}
            onClick={handleGenerateNow}
            className="px-4 py-2 rounded-xl bg-brain-600 hover:bg-brain-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            {generating ? "Analyzing..." : "Generate Follow-up ⚡"}
          </button>
        </div>
      </div>

      {/* Follow-ups List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading your personalized follow-ups...</div>
      ) : followups.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4">
          <span className="text-4xl">🌱</span>
          <h2 className="text-base font-bold text-slate-800">No Post-Class Follow-Ups Yet</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Participate in a live classroom session or click "Generate Follow-up" above to receive your personalized recap or challenge.
          </p>
          <button
            type="button"
            onClick={handleGenerateNow}
            className="px-5 py-2.5 rounded-xl bg-brain-50 text-brain-600 font-bold text-xs hover:bg-brain-100 transition"
          >
            Generate Demo Follow-up (Session: {selectedSessionId})
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {followups.map((item) => {
            const isRecap = item.subtype === "recap";
            const content = item.content || {};

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl border shadow-sm p-6 space-y-4 ${
                  isRecap ? "border-amber-200/80 border-l-4 border-l-amber-500" : "border-purple-200/80 border-l-4 border-l-purple-500"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{isRecap ? "💡" : "🚀"}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isRecap ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {isRecap ? "Personalized Recap" : "Extension Challenge"}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {item.session_id ? `Session: ${item.session_id}` : ""}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-slate-900 mt-1">{item.title}</h2>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(item.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Summary / Intro */}
                {(content.summary || content.intro) && (
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                    {content.summary || content.intro}
                  </p>
                )}

                {/* Recap Bullets */}
                {content.simplified_takeaways && content.simplified_takeaways.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Crystal-Clear Takeaways
                    </h3>
                    <ul className="space-y-1.5">
                      {content.simplified_takeaways.map((takeaway, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-2 text-xs text-slate-700">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Challenge Tasks */}
                {content.challenge_tasks && content.challenge_tasks.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider text-[11px]">
                      Stretch Problems & Applications
                    </h3>
                    <ul className="space-y-2">
                      {content.challenge_tasks.map((task, tIdx) => (
                        <li key={tIdx} className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs text-purple-950 font-medium">
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Check Questions */}
                {content.check_questions && content.check_questions.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <h3 className="text-xs font-bold text-slate-800">Quick Concept Check</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {content.check_questions.map((cq, cIdx) => (
                        <div key={cIdx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                          <div className="font-semibold text-slate-800">Q: {cq.q}</div>
                          <div className="text-slate-600 text-[11px]">A: {cq.a}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
