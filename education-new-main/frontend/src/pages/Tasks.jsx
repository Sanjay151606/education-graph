import { useEffect, useState } from "react";
import api from "../api/client";
import TaskCard from "../components/TaskCard";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import { Plus, Sparkles, CheckCircle, Clock, ListChecks } from "lucide-react";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => api.get("/api/tasks/").then((res) => setTasks(res.data));
  useEffect(() => {
    load();
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await api.post("/api/tasks/", { title, auto_breakdown: true });
      setTitle("");
      load();
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/api/tasks/${id}/status?status=${status}`);
    load();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brain-700 via-indigo-700 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">📋</span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Micro-Task Execution
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-indigo-100/90 max-w-xl">
          Enter any daunting homework or study goal. AI will automatically decompose it into
          manageable 15-minute micro-steps to prevent ADHD task paralysis.
        </p>
      </div>

      {/* Task Creation Form */}
      <Card className="space-y-3">
        <form onSubmit={addTask} className="flex flex-col sm:flex-row gap-2.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Complete Biology Chapter 4 summary and diagrams..."
            className="flex-1 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brain-500/20 focus:border-brain-500"
          />
          <button
            type="submit"
            disabled={!title.trim() || loading}
            className="bg-brain-600 hover:bg-brain-700 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{loading ? "Breaking Down..." : "Add + AI Breakdown"}</span>
          </button>
        </form>
      </Card>

      {/* Task List / Empty State */}
      {tasks.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No Active Tasks"
          description="Create your first study goal above to get an instant AI micro-step breakdown!"
        />
      ) : (
        <div className="space-y-3.5">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} onStatusChange={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}
