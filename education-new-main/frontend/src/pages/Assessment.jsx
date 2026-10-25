import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { assessmentApi } from '../services/api';
import { VoiceSpeakOnceTask } from '../components/assessment/VoiceSpeakOnceTask';
import { ReadSpeakOnceTask } from '../components/assessment/ReadSpeakOnceTask';
import { TimedAnswerTask } from '../components/assessment/TimedAnswerTask';
import { 
  Sparkles, 
  Brain, 
  CheckCircle2, 
  Layers, 
  Timer, 
  Eye, 
  Headphones, 
  RotateCw, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Sliders,
  History,
  Check
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const Assessment = () => {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();

  const [step, setStep] = useState('intro'); // 'intro', 'running', 'feedback', 'results', 'history'
  const [sessionId, setSessionId] = useState(null);
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastItemResult, setLastItemResult] = useState(null);
  const [summary, setSummary] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [isApplyingProfile, setIsApplyingProfile] = useState(false);

  // 1. Start Assessment
  const handleStart = async () => {
    setIsStarting(true);
    try {
      const res = await assessmentApi.start();
      setSessionId(res.data.session_id);
      setItems(res.data.items);
      setCurrentIndex(0);
      setStep('running');
      addToast('Cognitive check-in started. Take your time and trust your instincts!', 'info');
    } catch (err) {
      console.error('Failed to start assessment:', err);
      addToast('Could not start assessment session. Please try again.', 'error');
    } finally {
      setIsStarting(false);
    }
  };

  // 2. Handle Item Submission
  const handleItemSubmit = async (payload) => {
    setIsSubmittingItem(true);
    try {
      const res = await assessmentApi.respond(sessionId, payload);
      setLastItemResult(res.data);
      
      const currentItem = items[currentIndex];
      const isSpeech = currentItem.item_type !== 'timed_answer';

      if (isSpeech) {
        const simPct = Math.round((res.data.similarity_score || 0) * 100);
        addToast(
          res.data.is_correct ? `Strong recall! (${simPct}% similarity)` : `Recall logged (${simPct}%)`,
          res.data.is_correct ? 'success' : 'info',
          2500
        );
      } else {
        addToast(
          res.data.is_correct ? 'Correct! 🎯' : 'Response recorded.',
          res.data.is_correct ? 'success' : 'info',
          2000
        );
      }

      // Next item or complete
      if (currentIndex + 1 < items.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        await handleFinishAssessment();
      }
    } catch (err) {
      console.error('Failed to record response:', err);
      addToast('Failed to record response. Advancing...', 'error');
      if (currentIndex + 1 < items.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        await handleFinishAssessment();
      }
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // 3. Complete Assessment & Load Results
  const handleFinishAssessment = async () => {
    try {
      const res = await assessmentApi.complete(sessionId);
      setSummary(res.data);
      setStep('results');
      addToast('Assessment complete! Your personalized profile recommendations are ready.', 'success', 5000);
    } catch (err) {
      console.error('Error concluding assessment:', err);
      addToast('Could not finalize summary analysis.', 'error');
    }
  };

  // 4. Apply Suggested Changes to User Profile
  const handleApplyProfileUpdates = async () => {
    if (!summary) return;
    setIsApplyingProfile(true);
    try {
      await updateProfile({
        focus_span_minutes: summary.recommended_focus_span_minutes,
        preferred_content_style: summary.recommended_content_style,
        difficulty_level: summary.recommended_difficulty_level,
      });
      addToast('🎉 Your ADHD Learning Profile was updated with these calibrated recommendations!', 'success');
    } catch (err) {
      console.error('Failed to update profile settings:', err);
      addToast('Could not save profile updates.', 'error');
    } finally {
      setIsApplyingProfile(false);
    }
  };

  // 5. Load Past History
  const handleLoadHistory = async () => {
    try {
      const res = await assessmentApi.getHistory();
      setHistoryList(res.data);
      setStep('history');
    } catch (err) {
      console.error('Failed to load history:', err);
      addToast('Could not load assessment history.', 'error');
    }
  };

  // Chart data for results
  const breakdownChartData = {
    labels: ['Auditory Working Memory', 'Visual Working Memory', 'Timed Processing Speed'],
    datasets: [
      {
        label: 'Accuracy Score (%)',
        data: [
          summary?.per_type_breakdown?.voice_speak_once?.accuracy_percentage || 0,
          summary?.per_type_breakdown?.read_speak_once?.accuracy_percentage || 0,
          summary?.per_type_breakdown?.timed_answer?.accuracy_percentage || 0,
        ],
        backgroundColor: ['#8b5cf6', '#6366f1', '#22c55e'],
        borderRadius: 12,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 12,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { family: 'Plus Jakarta Sans', size: 11 } },
      },
    },
  };

  const currentItem = items[currentIndex];

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* View 1: Intro / Disclaimer Screen */}
      {step === 'intro' && (
        <div className="glass-panel-glow rounded-3xl p-8 sm:p-12 space-y-8 text-center relative overflow-hidden animate-float">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brain-500 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-brain-900/40">
            <Brain className="w-9 h-9 text-white" />
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Cognitive Pacing & Learning Check-in
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              A quick, 3-minute gamified check-in designed to evaluate your working memory stamina, auditory recall, and decision flow under light time pressure.
            </p>
          </div>

          {/* Three Task Modalities Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-brain-400 font-bold text-xs">
                <Headphones className="w-4 h-4" />
                <span>One-Time Listen</span>
              </div>
              <p className="text-xs text-slate-400">
                Audio plays once. Recall and speak back what you heard.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                <Eye className="w-4 h-4" />
                <span>Timed Exposure</span>
              </div>
              <p className="text-xs text-slate-400">
                Text appears for a few seconds and disappears. Recall the phrase.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-focus-400 font-bold text-xs">
                <Timer className="w-4 h-4" />
                <span>Rapid Decision</span>
              </div>
              <p className="text-xs text-slate-400">
                Quick answer prompts with a live visible countdown bar.
              </p>
            </div>
          </div>

          {/* Non-Clinical Disclaimer */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 flex items-start gap-3 text-left max-w-xl mx-auto">
            <ShieldCheck className="w-5 h-5 text-brain-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-200">Study Pacing Tool Disclaimer:</strong> This check-in is an adaptive educational pacing aid for learning style customization. It is <strong>not</strong> a medical test or clinical ADHD diagnostic instrument.
            </p>
          </div>

          {/* Start Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-brain-600 hover:bg-brain-500 text-white font-extrabold text-base shadow-xl shadow-brain-900/50 hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isStarting ? (
                <>
                  <RotateCw className="w-5 h-5 animate-spin" />
                  <span>Calibrating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Begin Check-in (10 Items)</span>
                </>
              )}
            </button>

            <button
              onClick={handleLoadHistory}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              <History className="w-4 h-4" />
              <span>Past Check-in Trends</span>
            </button>
          </div>
        </div>
      )}

      {/* View 2: Active Assessment Runner */}
      {step === 'running' && currentItem && (
        <div className="space-y-6">
          {/* Header Progress Bar */}
          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <span>Task {currentIndex + 1} of {items.length}</span>
            </div>
            <div className="flex-1 max-w-xs bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-brain-500 to-focus-500 h-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono text-brain-400 font-bold">
              {Math.round(((currentIndex + 1) / items.length) * 100)}%
            </span>
          </div>

          {/* Switch by Task Type */}
          {currentItem.item_type === 'voice_speak_once' && (
            <VoiceSpeakOnceTask item={currentItem} onSubmit={handleItemSubmit} />
          )}

          {currentItem.item_type === 'read_speak_once' && (
            <ReadSpeakOnceTask item={currentItem} onSubmit={handleItemSubmit} />
          )}

          {currentItem.item_type === 'timed_answer' && (
            <TimedAnswerTask item={currentItem} onSubmit={handleItemSubmit} />
          )}
        </div>
      )}

      {/* View 3: Results & AI Recommendations Screen */}
      {step === 'results' && summary && (
        <div className="glass-panel-glow rounded-3xl p-6 sm:p-10 space-y-8 animate-float">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2 text-focus-400 text-xs font-bold uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Check-in Complete</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Your Cognitive Calibration Profile
              </h1>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl self-start">
              <span className="text-xs text-slate-400 font-semibold uppercase">Overall Flow:</span>
              <span className="text-2xl font-extrabold text-focus-400 font-mono">
                {summary.overall_score}%
              </span>
            </div>
          </div>

          {/* AI Learning Summary Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-brain-950/60 via-slate-900 to-indigo-950/60 border border-brain-500/30 space-y-2">
            <div className="flex items-center gap-2 text-brain-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>AI Learning Observation & Study Pacing</span>
            </div>
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
              {summary.ai_summary}
            </p>
          </div>

          {/* Modality Accuracy Chart */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-brain-400" />
              Recall & Processing Accuracy by Task Type
            </h2>
            <div className="h-56 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <Bar data={breakdownChartData} options={chartOptions} />
            </div>
          </div>

          {/* Recommended Profile Updates Card */}
          <div className="glass-panel rounded-3xl p-6 space-y-6 border-2 border-focus-500/30">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-focus-400" />
                  Calibrated ADHD Profile Recommendations
                </h3>
                <p className="text-xs text-slate-400">
                  Review and apply these customized settings directly to your BrainGraph workspace.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Sprint Duration
                </span>
                <div className="text-xl font-extrabold text-focus-400 font-mono">
                  {summary.recommended_focus_span_minutes}m
                </div>
                <span className="text-[11px] text-slate-500">Optimal attention interval</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Format Style
                </span>
                <div className="text-xl font-extrabold text-brain-300 capitalize">
                  {summary.recommended_content_style.replace('_', ' ')}
                </div>
                <span className="text-[11px] text-slate-500">Highest working memory recall</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Breakdown Depth
                </span>
                <div className="text-xl font-extrabold text-amber-300 capitalize">
                  {summary.recommended_difficulty_level}
                </div>
                <span className="text-[11px] text-slate-500">Low-friction task granularity</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
              <button
                onClick={() => setStep('intro')}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Dismiss & Return
              </button>

              <button
                onClick={handleApplyProfileUpdates}
                disabled={isApplyingProfile}
                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-focus-600 hover:bg-focus-500 text-white font-bold text-sm shadow-lg shadow-focus-900/40 hover:scale-105 transition-all disabled:opacity-50"
              >
                {isApplyingProfile ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Apply Calibration to My Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View 4: Past Check-in History */}
      {step === 'history' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-brain-400" />
              Past Assessment Sessions
            </h2>
            <button
              onClick={() => setStep('intro')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Back to Start
            </button>
          </div>

          {historyList.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              No previous assessment history on record. Take your first check-in above!
            </p>
          ) : (
            <div className="space-y-4">
              {historyList.map((session) => (
                <div
                  key={session.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">
                      {new Date(session.completed_at || session.started_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="text-sm font-extrabold text-focus-400 font-mono">
                      {session.overall_score}% Score
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {session.ai_summary}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
