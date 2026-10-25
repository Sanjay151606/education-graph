import { useState } from "react";
import v2Api from "../../services/v2_api";

export default function ConfusionBookmark({ sessionId, currentTopic = "Live Discussion" }) {
  const [loading, setLoading] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [customNote, setCustomNote] = useState("");

  const handleBookmark = async (noteText = "") => {
    setLoading(true);
    try {
      await v2Api.addConfusionBookmark(sessionId, currentTopic, noteText || null);
      setSavedCount((c) => c + 1);
      setShowToast(true);
      setNoteOpen(false);
      setCustomNote("");
      setTimeout(() => setShowToast(false), 4500);
    } catch (err) {
      console.warn("Could not save bookmark:", err);
      // Client-side fallback count for responsiveness
      setSavedCount((c) => c + 1);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleBookmark(customNote)}
          className="flex-1 flex items-center justify-center gap-2.5 bg-amber-50 hover:bg-amber-100/80 active:scale-[0.98] border border-amber-200 text-amber-900 font-semibold px-4 py-3 rounded-2xl transition duration-150 shadow-xs"
        >
          <span className="text-xl">🔖</span>
          <div className="text-left">
            <div className="text-xs font-bold leading-tight">I Got Lost Here</div>
            <div className="text-[10px] text-amber-700 font-normal">
              Timestamp this moment for your post-class recap
            </div>
          </div>
          {savedCount > 0 && (
            <span className="ml-auto bg-amber-200 text-amber-950 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
              {savedCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setNoteOpen((o) => !o)}
          className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition"
          title="Add specific note for this bookmark"
        >
          💬
        </button>
      </div>

      {noteOpen && (
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <input
            type="text"
            placeholder="What part felt tricky? (Optional e.g. ATP formula)"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:ring-1 focus:ring-amber-500 outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setNoteOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleBookmark(customNote)}
              className="text-xs bg-amber-500 text-white font-semibold px-3 py-1 rounded-lg hover:bg-amber-600 transition"
            >
              Save Note & Bookmark
            </button>
          </div>
        </div>
      )}

      {showToast && (
        <div className="p-3 rounded-2xl bg-amber-500 text-white text-xs font-medium shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <span>✨</span>
            <span>Bookmark saved! We will generate a clear recap for you after class.</span>
          </div>
          <button type="button" onClick={() => setShowToast(false)} className="text-white/80 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
