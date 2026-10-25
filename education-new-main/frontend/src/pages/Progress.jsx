import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import { TrendingUp, Sparkles, Award, RefreshCw, Calendar } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

export default function Progress() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(false);
      try {
        const res = await api.get("/api/progress/");
        setLogs((res.data || []).reverse());
      } catch (e) {
        console.warn("Could not load progress:", e);
      }

      if (user?.id) {
        try {
          const digestRes = await api.get(`/api/ai/weekly-digest/${user.id}`);
          setWeeklyDigest(digestRes.data);
        } catch (e) {
          console.warn("Could not load weekly digest:", e);
        }
      }
    }
    loadData();
  }, [user?.id]);

  const data = {
    labels: logs.map((l) =>
      new Date(l.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    ),
    datasets: [
      {
        label: "Mastery Score (%)",
        data: logs.map((l) => l.score ?? null),
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79, 70, 229, 0.08)",
        fill: true,
        tension: 0.35,
        pointBackgroundColor: "#4f46e5",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          font: { size: 10 },
          color: "#94a3b8",
        },
        grid: {
          color: "#f1f5f9",
        },
      },
      x: {
        ticks: {
          font: { size: 10 },
          color: "#94a3b8",
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brain-700 via-indigo-700 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">📈</span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Learning Progress & Mastery
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-indigo-100/90 max-w-xl">
          Visualized performance trends and AI weekly digests calibrated to sustained progress.
        </p>
      </div>

      {/* Weekly AI Digest Summary Card */}
      {weeklyDigest && (
        <Card className="space-y-3 border-indigo-200/70 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/40">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-purple-100 text-purple-700">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-black text-slate-900">Weekly AI Performance Digest</h2>
              <p className="text-[11px] font-semibold text-slate-400">Auto-generated low-stress celebratory review</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed pt-1">
            {weeklyDigest.summary}
          </p>

          {weeklyDigest.celebrations && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              {weeklyDigest.celebrations.map((c, i) => (
                <div key={i} className="p-3 rounded-2xl bg-white border border-indigo-100 text-xs text-indigo-950 font-bold shadow-2xs flex items-center gap-2">
                  <span>🎉</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Progress Chart Card */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brain-600" />
            <h3 className="text-sm font-black text-slate-900">Mastery Score Over Time</h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400">Past 30 Days</span>
        </div>

        <div className="pt-2">
          {logs.length > 0 ? (
            <div className="h-64 sm:h-72">
              <Line data={data} options={chartOptions} />
            </div>
          ) : (
            <EmptyState
              icon="📊"
              title="No Activity Logged Yet"
              description="Complete quizzes and micro-tasks to watch your mastery score trend upward."
            />
          )}
        </div>
      </Card>
    </div>
  );
}
