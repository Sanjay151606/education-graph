import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Mic,
  Volume2,
  BookOpen,
  HelpCircle,
  Headphones,
  ShieldCheck,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Sparkles,
  Info,
  Layers,
  Play
} from 'lucide-react';

export default function AssessmentIntro() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [candidateName, setCandidateName] = useState(user?.name || user?.full_name || 'Alex Rivera');
  const [hasMicPermission, setHasMicPermission] = useState(null);
  const [isCheckingMic, setIsCheckingMic] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user?.name || user?.full_name) {
      setCandidateName(user.name || user.full_name);
    }
  }, [user]);

  // Check microphone permissions
  const checkMicrophone = async () => {
    setIsCheckingMic(true);
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasMicPermission(true);
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      console.warn('Microphone permission error:', err);
      setHasMicPermission(false);
      setErrorMsg('Microphone access is recommended for speaking sections A and B.');
    } finally {
      setIsCheckingMic(false);
    }
  };

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' })
        .then((res) => {
          if (res.state === 'granted') setHasMicPermission(true);
        })
        .catch(() => {});
    }
  }, []);

  const handleStartSection = async (targetPath = '/assessment/section-a') => {
    const finalName = (candidateName || 'Learner').trim();
    setIsStarting(true);
    setErrorMsg('');

    let activeSessionId = sessionStorage.getItem('bg_assessment_session_id');

    try {
      const res = await assessmentApi.start({ candidate_name: finalName });
      if (res.data?.session_id) {
        activeSessionId = res.data.session_id;
        sessionStorage.setItem('bg_assessment_session_id', activeSessionId);
        sessionStorage.setItem('bg_assessment_candidate_name', res.data.candidate_name || finalName);
        if (res.data.items) {
          sessionStorage.setItem('bg_assessment_section_a_items', JSON.stringify(res.data.items));
        }
      }
    } catch (err) {
      console.warn('Assessment API fallback for direct start:', err);
      if (!activeSessionId) {
        activeSessionId = `session-${Date.now()}`;
        sessionStorage.setItem('bg_assessment_session_id', activeSessionId);
        sessionStorage.setItem('bg_assessment_candidate_name', finalName);
      }
    } finally {
      setIsStarting(false);
      navigate(targetPath, { state: { sessionId: activeSessionId } });
    }
  };

  const sectionsOverview = [
    {
      id: 'A',
      path: '/assessment/section-a',
      badge: '🅰️ Section A',
      title: 'Reading & Listening',
      color: 'border-blue-200 bg-blue-50/70 hover:bg-blue-50/90 text-blue-900',
      badgeColor: 'bg-blue-600 text-white',
      buttonBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
      icon: BookOpen,
      count: '23 Questions',
      items: '18 Read-Aloud + 5 Listen-Repeat',
      time: '~15 Mins',
      desc: 'Read sentences aloud under timed prompts, then listen to single-play audio sentences and repeat.',
    },
    {
      id: 'B',
      path: '/assessment/section-b',
      badge: '🅱️ Section B',
      title: 'Speaking Tasks',
      color: 'border-amber-200 bg-amber-50/70 hover:bg-amber-50/90 text-amber-900',
      badgeColor: 'bg-amber-600 text-white',
      buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20',
      icon: Mic,
      count: '4 Topics',
      items: '4 Open-Ended Speaking Topics',
      time: '~10 Mins',
      desc: '90 seconds of silent preparation with hint prompts, followed by 60 seconds of recorded speaking.',
    },
    {
      id: 'C',
      path: '/assessment/section-c',
      badge: '🅾️ Section C',
      title: 'Grammar Accuracy',
      color: 'border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50/90 text-emerald-900',
      badgeColor: 'bg-emerald-600 text-white',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
      icon: HelpCircle,
      count: '34 Questions',
      items: 'Verb Forms, Tenses, Articles & Voice',
      time: '~20 Mins',
      desc: 'Multiple-choice questions testing core syntactic patterns, tenses, prepositions, and sentence correction.',
    },
    {
      id: 'D',
      path: '/assessment/section-d',
      badge: '🅳 Section D',
      title: 'Listening Comprehension',
      color: 'border-purple-200 bg-purple-50/70 hover:bg-purple-50/90 text-purple-900',
      badgeColor: 'bg-purple-600 text-white',
      buttonBg: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20',
      icon: Headphones,
      count: '16 Questions',
      items: '4 Passages (4 MCQs each)',
      time: '~20 Mins',
      desc: 'Listen to full audio passages played once without pause/rewind. Questions unlock only after listening.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Hero Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-brain-50 text-brain-700 rounded-full text-xs font-bold border border-brain-200/70">
                <Sparkles className="w-3.5 h-3.5 text-brain-600" />
                <span>Standardized 4-Section Diagnostic Assessment</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                English Proficiency Assessment
              </h1>

              <p className="text-slate-600 text-sm max-w-xl leading-relaxed">
                Complete all 4 sections to calibrate your learning profile, calibrate speaking fluency, and generate an AI-tailored study roadmap.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <div className="text-2xl font-black text-slate-900">77</div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Questions</div>
              </div>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <div className="text-2xl font-black text-slate-900">~65m</div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Duration</div>
              </div>
            </div>
          </div>

          {/* Candidate Setup & Microphone Check */}
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Candidate Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Enter full name for certificate & results"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-brain-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Microphone Verification
              </label>
              <button
                type="button"
                onClick={checkMicrophone}
                disabled={isCheckingMic}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition shadow-xs ${
                  hasMicPermission
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                }`}
              >
                <Mic className={`w-4 h-4 ${hasMicPermission ? 'text-emerald-600' : 'text-slate-500'}`} />
                {isCheckingMic
                  ? 'Testing Mic...'
                  : hasMicPermission
                  ? 'Mic Verified ✓'
                  : 'Test Microphone (Optional)'}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* 4 Interactive Section Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>Assessment Sections (Click any section to attend questions)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                You can start with Section A or click directly on any section below:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sectionsOverview.map((sec) => {
              const Icon = sec.icon;
              return (
                <div
                  key={sec.id}
                  className={`rounded-2xl border-2 p-6 transition-all duration-200 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 ${sec.color}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-lg text-xs font-black tracking-wide ${sec.badgeColor}`}>
                        {sec.badge}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/90 border border-slate-200 text-slate-600 shadow-2xs">
                        {sec.time}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900">{sec.title}</h3>
                      <p className="text-xs font-bold opacity-80 mt-0.5">{sec.items}</p>
                    </div>

                    <p className="text-xs leading-relaxed opacity-90">{sec.desc}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-700">{sec.count}</span>

                    <button
                      type="button"
                      onClick={() => handleStartSection(sec.path)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${sec.buttonBg}`}
                    >
                      <span>Start {sec.id}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instructions Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Info className="w-5 h-5 text-brain-600" />
            <h3>Important Instructions & Proctoring Guidelines</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Microphone:</strong> Speak clearly during speaking questions in Sections A & B.</span>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Audio Playback:</strong> Listen carefully to audio clips in Sections A & D.</span>
            </div>

            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span><strong>Tab Proctoring:</strong> Avoid switching browser tabs during the test.</span>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Autosaving:</strong> Answers and speech audio are saved immediately on completion.</span>
            </div>
          </div>
        </div>

        {/* Main Action Callout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gradient-to-r from-brain-600 to-indigo-600 rounded-3xl text-white shadow-lg">
          <div>
            <h4 className="font-black text-xl">Ready to begin the full test?</h4>
            <p className="text-brain-100 text-xs sm:text-sm mt-0.5">Start with Section A and proceed through all 4 sections.</p>
          </div>

          <button
            type="button"
            onClick={() => handleStartSection('/assessment/section-a')}
            disabled={isStarting}
            className="w-full sm:w-auto px-8 py-4 bg-white text-brain-700 hover:bg-brain-50 font-black rounded-2xl text-sm transition shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95 disabled:opacity-50"
          >
            {isStarting ? (
              <span>Starting Test...</span>
            ) : (
              <>
                <span>Start Section A (Questions)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
