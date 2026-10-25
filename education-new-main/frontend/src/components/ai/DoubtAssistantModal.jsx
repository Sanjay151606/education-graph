import React, { useState } from "react";
import api from "../../api/client";
import { X, MessageSquare, Send, Sparkles, HelpCircle, Bot, User as UserIcon, RefreshCw } from "lucide-react";

export default function DoubtAssistantModal({ materialId, materialTitle, onClose }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I'm your BrainGraph doubt assistant for "${materialTitle || "your study module"}". Ask me any question, and I'll explain it in short, ADHD-friendly chunks!`,
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!question.trim() || loading) return;

    const userText = question.trim();
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setLoading(true);

    try {
      const res = await api.post("/api/ai/doubt-solver", {
        material_id: materialId,
        question: userText,
      });

      const answerText = res.data?.answer || "I've processed your question. Focus on the core definition first!";
      const takeaway = res.data?.key_takeaway ? `\n\n💡 *Key Takeaway:* ${res.data.key_takeaway}` : "";
      
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: answerText + takeaway,
          followup: res.data?.suggested_followup,
        },
      ]);
    } catch (err) {
      console.error("Doubt solver error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble processing that question. Please try asking in a simpler phrase!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl h-[560px] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-brain-50 text-brain-600 border border-brain-200/60">
              <Bot className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900">Doubt-Solving Assistant</h3>
              <p className="text-[11px] font-semibold text-slate-500 truncate max-w-xs">
                {materialTitle || "Instant Concept Clarification"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat History Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-50/30">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${
                m.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                  m.role === "user"
                    ? "bg-brain-600 text-white"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {m.role === "user" ? "👤" : "🤖"}
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs max-w-[82%] leading-relaxed ${
                  m.role === "user"
                    ? "bg-brain-600 text-white font-medium"
                    : "bg-white border border-slate-200 text-slate-800 shadow-xs whitespace-pre-line"
                }`}
              >
                {m.content}

                {m.followup && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuestion(m.followup);
                    }}
                    className="block mt-2.5 pt-2 border-t border-slate-100 text-[11px] font-bold text-purple-700 hover:underline text-left cursor-pointer"
                  >
                    💬 {m.followup}
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 w-fit">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
              <span>Thinking in bite-sized chunks…</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3.5 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type your question or doubt here..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
          />
          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="p-2.5 rounded-2xl bg-brain-600 hover:bg-brain-700 text-white transition disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
