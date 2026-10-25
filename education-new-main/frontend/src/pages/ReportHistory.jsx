import React, { useState, useEffect, useCallback } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  FileText,
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Award,
  Send,
} from "lucide-react";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function ReportHistory() {
  const { user } = useAuth();
  const userId = user?.id;

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [resendStatus, setResendStatus] = useState({});

  const fetchReports = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/reports/${userId}`);
      setReports(res.data || []);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError("Unable to load completion reports history.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResend = async (reportId) => {
    setResendingId(reportId);
    try {
      await api.post(`/reports/${reportId}/resend`);
      setResendStatus((prev) => ({ ...prev, [reportId]: "Dispatched!" }));
      setTimeout(() => {
        setResendStatus((prev) => ({ ...prev, [reportId]: null }));
      }, 3000);
    } catch (err) {
      console.error("Resend error:", err);
      setResendStatus((prev) => ({ ...prev, [reportId]: "Failed" }));
    } finally {
      setResendingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "sent":
      case "sent_simulated":
        return {
          label: "Sent (SMS & Email)",
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
        };
      case "opted_out":
        return {
          label: "Notification Opted Out",
          bg: "bg-slate-100",
          text: "text-slate-600",
          border: "border-slate-200",
        };
      case "failed":
        return {
          label: "Dispatch Failed",
          bg: "bg-rose-50",
          text: "text-rose-700",
          border: "border-rose-200",
        };
      default:
        return {
          label: "Pending",
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brain-700 via-indigo-700 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">📊</span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Work Completion & Parent Reports
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-indigo-100/90 max-w-xl">
              Automatic milestone summaries and score notifications dispatched to your mobile
              number and parent contact upon completing tasks.
            </p>
          </div>

          <button
            onClick={fetchReports}
            className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer backdrop-blur-xs w-fit"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button
            onClick={fetchReports}
            className="text-rose-600 hover:text-rose-900 font-bold ml-2 underline cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && <LoadingSpinner label="Loading past completion reports…" />}

      {/* Empty State */}
      {!loading && reports.length === 0 && (
        <EmptyState
          icon="📋"
          title="No Completion Reports Yet"
          description="When you complete study tasks, modules, or quizzes, automatic plain-language performance reports will appear here and be dispatched via SMS & Email."
        />
      )}

      {/* Reports List */}
      {!loading && reports.length > 0 && (
        <div className="space-y-3.5">
          {reports.map((report) => {
            const isExpanded = expandedReportId === report.id;
            const statusInfo = getStatusBadge(report.sent_status);
            const dateStr = new Date(report.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <Card
                key={report.id}
                className="transition-all hover:border-brain-300 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                      >
                        {statusInfo.label}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dateStr}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2">
                      {report.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {report.score !== null && (
                      <span className="px-3 py-1 rounded-xl bg-brain-50 text-brain-700 text-xs font-black border border-brain-200">
                        Score: {report.score}%
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Full Report Summary:</span>
                      </div>
                      <p>{report.summary}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>Dispatched via Email</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          <span>Dispatched via SMS</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleResend(report.id)}
                        disabled={resendingId === report.id}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>
                          {resendStatus[report.id] ||
                            (resendingId === report.id ? "Sending…" : "Resend Notification")}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
