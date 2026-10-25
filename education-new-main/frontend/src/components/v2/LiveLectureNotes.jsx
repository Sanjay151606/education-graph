import { useState, useEffect } from "react";
import v2Api from "../../services/v2_api";

const DEMO_TRANSCRIPT_FEEDS = [
  {
    topic: "Cellular Respiration & Glycolysis",
    raw: "Now notice how in glycolysis, the 6-carbon glucose molecule is split into two 3-carbon pyruvate molecules. This initial breakdown produces 2 net ATP and 2 NADH molecules without needing oxygen.",
    fallbackPoints: [
      "Glucose (6-carbon) splits into two 3-carbon pyruvates.",
      "Net energy produced: 2 ATP and 2 NADH.",
      "Anaerobic phase: does not require oxygen.",
    ],
    takeaway: "Glycolysis splits 1 glucose into 2 pyruvates, yielding net 2 ATP.",
  },
  {
    topic: "Mitochondrial Matrix & Krebs Cycle",
    raw: "Once pyruvate enters the mitochondrial matrix, it converts into Acetyl-CoA. This enters the Krebs Cycle, generating electron carriers NADH and FADH2 that fuel the electron transport chain.",
    fallbackPoints: [
      "Pyruvate enters mitochondria and transforms into Acetyl-CoA.",
      "Krebs cycle generates high-energy electron carriers (NADH, FADH2).",
      "These carriers will power ATP synthase in the membrane.",
    ],
    takeaway: "Krebs cycle harvests high-energy electrons to power ATP synthesis.",
  },
  {
    topic: "Electron Transport Chain & ATP Synthase",
    raw: "The electron transport chain creates a high concentration of protons in the intermembrane space. As protons rush back through ATP Synthase, rotary mechanical action synthesizes approximately 28 to 32 ATP.",
    fallbackPoints: [
      "Proton gradient is pumped across the inner mitochondrial membrane.",
      "Protons flow through ATP Synthase turbine.",
      "Massive ATP generation: yields ~30-32 ATP per glucose.",
    ],
    takeaway: "Oxidative phosphorylation is the main ATP powerhouse of the cell.",
  },
];

export default function LiveLectureNotes({ topic = "Cellular Biology", isCompact = false }) {
  const [chunks, setChunks] = useState([]);
  const [feedIndex, setFeedIndex] = useState(0);
  const [loadingChunk, setLoadingChunk] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchNextChunk = async (index) => {
    const currentFeed = DEMO_TRANSCRIPT_FEEDS[index % DEMO_TRANSCRIPT_FEEDS.length];
    setLoadingChunk(true);
    try {
      const res = await v2Api.chunkLiveNotes(currentFeed.raw, topic);
      setChunks((prev) => [
        {
          id: Date.now(),
          timestamp: res.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          keyPoints: res.key_points && res.key_points.length > 0 ? res.key_points : currentFeed.fallbackPoints,
          takeaway: res.takeaway_one_liner || currentFeed.takeaway,
        },
        ...prev.slice(0, 5), // Keep latest 6 chunks
      ]);
    } catch (e) {
      // Fallback
      setChunks((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          keyPoints: currentFeed.fallbackPoints,
          takeaway: currentFeed.takeaway,
        },
        ...prev.slice(0, 5),
      ]);
    } finally {
      setLoadingChunk(false);
    }
  };

  useEffect(() => {
    // Initial chunk
    fetchNextChunk(0);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setFeedIndex((prev) => {
        const next = prev + 1;
        fetchNextChunk(next);
        return next;
      });
    }, 28000); // refresh every ~28-30s

    return () => clearInterval(interval);
  }, [autoRefresh, topic]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brain-50 text-brain-600 flex items-center justify-center text-base">
            📝
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Real-Time Lecture Catch-Up</h3>
            <p className="text-[11px] text-slate-400">Auto-chunked notes refreshed every ~30s</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = feedIndex + 1;
              setFeedIndex(next);
              fetchNextChunk(next);
            }}
            disabled={loadingChunk}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-brain-50 text-brain-600 hover:bg-brain-100 transition disabled:opacity-50"
          >
            {loadingChunk ? "Summarizing..." : "⚡ Next Point"}
          </button>
          <button
            type="button"
            onClick={() => setAutoRefresh((r) => !r)}
            className={`px-2 py-1 rounded-lg text-xs font-medium border ${
              autoRefresh ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"
            }`}
          >
            {autoRefresh ? "Live 🟢" : "Paused ⏸️"}
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {chunks.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Listening to live lecture feed...
          </div>
        ) : (
          chunks.map((chunk, idx) => (
            <div
              key={chunk.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                idx === 0
                  ? "bg-brain-50/40 border-brain-200 shadow-xs"
                  : "bg-slate-50/60 border-slate-200/60 opacity-80"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
                <span className="flex items-center gap-1.5 text-brain-700">
                  {idx === 0 && <span className="w-2 h-2 rounded-full bg-brain-500 animate-ping" />}
                  <span>{idx === 0 ? "Latest 30s Window" : "Previous Moment"}</span>
                </span>
                <span className="font-mono text-[10px] text-slate-400">{chunk.timestamp}</span>
              </div>

              <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                {chunk.keyPoints.map((pt, pIdx) => (
                  <li key={pIdx} className="leading-relaxed">
                    <span className="font-medium text-slate-800">{pt}</span>
                  </li>
                ))}
              </ul>

              {chunk.takeaway && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-brain-800 font-medium flex items-start gap-1.5">
                  <span className="text-xs">💡</span>
                  <span>{chunk.takeaway}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <p className="text-[10px] text-slate-400 italic text-center">
        ⚡ Lost focus for a moment? Skim the latest bullet points to seamlessly rejoin the discussion.
      </p>
    </div>
  );
}
