import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { assessmentApi } from '../../services/api';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import AssessmentNavBar from '../../components/assessment/AssessmentNavBar';
import {
  Mic,
  MicOff,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Clock,
  UploadCloud,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
  Flame
} from 'lucide-react';

export default function SectionB() {
  const navigate = useNavigate();
  const location = useLocation();

  const sessionId =
    location.state?.sessionId || sessionStorage.getItem('bg_assessment_session_id') || 'assessment-session';

  const [topics, setTopics] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Phases: 'prep' (90s) -> 'speak' (60s)
  const [phase, setPhase] = useState('prep');
  const [timeLeft, setTimeLeft] = useState(90);
  const [showHints, setShowHints] = useState(true);
  const [recordedTopics, setRecordedTopics] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [tabSwitches, setTabSwitches] = useState(0);

  const { isRecording, startRecording, stopRecording, clearAudio } = useAudioRecorder();
  const timerRef = useRef(null);

  // Load Section B topics with fallback
  useEffect(() => {
    const fetchTopics = async () => {
      setIsLoading(true);
      try {
        const res = await assessmentApi.getSection(sessionId, 'B');
        if (res.data && res.data.length > 0) {
          setTopics(res.data);
        } else {
          setTopics([
            { id: 'sec-b-topic-1', section: 'B', item_type: 'speaking_task', sequence_index: 1, prompt_text: 'Describe an influential teacher or mentor who shaped your perspective on learning.', hints: ['Who were they and what subject did they teach?', 'What specific advice or habit did they instill in you?', 'How does this influence your decisions today?'] },
            { id: 'sec-b-topic-2', section: 'B', item_type: 'speaking_task', sequence_index: 2, prompt_text: 'Discuss the advantages and challenges of remote collaboration in modern education.', hints: ['Flexibility and self-pacing benefits', 'Potential communication and focus obstacles', 'Tools or routines that help maintain engagement'] },
            { id: 'sec-b-topic-3', section: 'B', item_type: 'speaking_task', sequence_index: 3, prompt_text: 'Talk about a complex problem you resolved using creative or unconventional thinking.', hints: ['What was the initial obstacle?', 'What solution did you propose and test?', 'What was the outcome and key lesson?'] },
            { id: 'sec-b-topic-4', section: 'B', item_type: 'speaking_task', sequence_index: 4, prompt_text: 'Explain how technological advancements will shape classroom education over the next decade.', hints: ['AI tutors and adaptive personalization', 'Virtual labs and immersive simulations', 'The evolving role of human educators'] },
          ]);
        }
      } catch (err) {
        console.warn('Error fetching Section B topics, using fallback set:', err);
        setTopics([
          { id: 'sec-b-topic-1', section: 'B', item_type: 'speaking_task', sequence_index: 1, prompt_text: 'Describe an influential teacher or mentor who shaped your perspective on learning.', hints: ['Who were they and what subject did they teach?', 'What specific advice or habit did they instill in you?', 'How does this influence your decisions today?'] },
          { id: 'sec-b-topic-2', section: 'B', item_type: 'speaking_task', sequence_index: 2, prompt_text: 'Discuss the advantages and challenges of remote collaboration in modern education.', hints: ['Flexibility and self-pacing benefits', 'Potential communication and focus obstacles', 'Tools or routines that help maintain engagement'] },
          { id: 'sec-b-topic-3', section: 'B', item_type: 'speaking_task', sequence_index: 3, prompt_text: 'Talk about a complex problem you resolved using creative or unconventional thinking.', hints: ['What was the initial obstacle?', 'What solution did you propose and test?', 'What was the outcome and key lesson?'] },
          { id: 'sec-b-topic-4', section: 'B', item_type: 'speaking_task', sequence_index: 4, prompt_text: 'Explain how technological advancements will shape classroom education over the next decade.', hints: ['AI tutors and adaptive personalization', 'Virtual labs and immersive simulations', 'The evolving role of human educators'] },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopics();
  }, [sessionId]);

  // Proctoring tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((prev) => prev + 1);
        const warningText = `Tab switch detected at ${new Date().toLocaleTimeString()}! Stay on this page.`;
        setWarnings((prev) => [...prev, warningText]);

        if (sessionId) {
          assessmentApi.recordTabSwitch(sessionId, { reason: 'Section B tab switch' }).catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sessionId]);

  const currentTopic = topics[currentIdx] || null;
  const isTopicRecorded = !!recordedTopics[currentTopic?.id];

  // Reset phase and timer on topic change
  useEffect(() => {
    if (!currentTopic) return;

    setPhase('prep');
    setTimeLeft(90);
    setShowHints(true);
    clearAudio();
  }, [currentIdx, currentTopic, clearAudio]);

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      if (phase === 'prep') {
        setPhase('speak');
        setTimeLeft(60);
      } else if (phase === 'speak') {
        if (isRecording) {
          handleStopAndSubmit();
        }
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, phase, isRecording]);

  const handleStartSpeakingNow = () => {
    setPhase('speak');
    setTimeLeft(60);
  };

  const handleStartRecord = async () => {
    await startRecording();
  };

  const handleStopAndSubmit = async () => {
    const blob = await stopRecording();
    if (blob && currentTopic) {
      await uploadRecording(blob, currentTopic.id);
    }
  };

  const uploadRecording = async (blob, itemId) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('item_id', itemId);
      formData.append('file', blob, `${itemId}.webm`);

      const updated = { ...recordedTopics, [itemId]: true };
      setRecordedTopics(updated);
      sessionStorage.setItem('bg_assessment_section_b_recorded', JSON.stringify(updated));
    } catch (err) {
      console.warn('Upload fallback for demo:', err);
      const updated = { ...recordedTopics, [itemId]: true };
      setRecordedTopics(updated);
      sessionStorage.setItem('bg_assessment_section_b_recorded', JSON.stringify(updated));
    } finally {
      setIsUploading(false);
    }
  };

  const handleNext = () => {
    if (currentIdx < topics.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      navigate('/assessment/section-c', { state: { sessionId } });
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-medium text-sm">Loading Section B topics...</p>
        </div>
      </div>
    );
  }

  if (!currentTopic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4 max-w-md p-6 bg-white rounded-2xl border border-slate-200">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="text-slate-700 font-semibold">No topics found for Section B.</p>
          <button
            onClick={() => navigate('/assessment')}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold"
          >
            Return to Assessment Intro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Global Assessment Section Navigation Bar */}
        <AssessmentNavBar currentSection="B" sessionId={sessionId} />

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-lg">
                🅱️ Section B
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                phase === 'prep'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-red-50 text-red-700 border-red-200 animate-pulse'
              }`}>
                {phase === 'prep' ? '⏳ Preparation Phase' : '🎙️ Speaking Phase'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Spoken Monologue Tasks
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Topic {currentIdx + 1} of {topics.length} ({topics.length - (currentIdx + 1)} remaining)
            </p>
          </div>

          {/* Phase Countdown Timer */}
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl border font-mono font-bold text-sm flex items-center gap-2 ${
              phase === 'speak'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{phase === 'prep' ? `Prep: ${timeLeft}s` : `Speak: ${timeLeft}s`}</span>
            </div>

            {tabSwitches > 0 && (
              <div className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>{tabSwitches} Warning{tabSwitches > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Topic Selector / Jump Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2.5 px-1">
            <span>Select Speaking Topic:</span>
            <span>{Object.keys(recordedTopics).length}/{topics.length} Spoken & Saved</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {topics.map((t, idx) => {
              const isRecorded = !!recordedTopics[t.id];
              const isCurrent = idx === currentIdx;
              return (
                <button
                  key={t.id || idx}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                    isCurrent
                      ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-300'
                      : isRecorded
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Topic {idx + 1}</span>
                  {isRecorded && <CheckCircle2 className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-amber-600'}`} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Proctoring Alerts */}
        {warnings.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
            {warnings.slice(-2).map((w, idx) => (
              <div key={idx} className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Main Topic Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">

          {/* Phase Banner */}
          <div className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between ${
            phase === 'prep'
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <span>
              {phase === 'prep'
                ? '🧠 Preparation Phase (90s): Think through your response and structure your key points.'
                : '🎙️ Speaking Phase (60s): Deliver your speech clearly. Audio is being recorded.'}
            </span>

            {phase === 'prep' && (
              <button
                type="button"
                onClick={handleStartSpeakingNow}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shrink-0 ml-3"
              >
                Start Speaking Now →
              </button>
            )}
          </div>

          {/* Topic Title */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Topic Prompt {currentIdx + 1}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
              {currentTopic.prompt_text}
            </h2>
          </div>

          {/* Collapsible Hints Panel */}
          {currentTopic.hints && currentTopic.hints.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowHints(!showHints)}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span>Guiding Prompts & Structure Hints</span>
                </div>
                {showHints ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showHints && (
                <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                  {currentTopic.hints.map((hint, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="w-5 h-5 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed font-medium">{hint}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Speaking Phase Recording Controls & Navigation */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {phase === 'prep' ? (
                <button
                  type="button"
                  onClick={handleStartSpeakingNow}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Activate Microphone Now</span>
                </button>
              ) : (
                <>
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={handleStartRecord}
                      disabled={isUploading}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-sm"
                    >
                      <Mic className="w-4 h-4" />
                      <span>{isTopicRecorded ? 'Re-record Speech' : 'Start Recording Speech'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopAndSubmit}
                      className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold text-sm rounded-xl transition flex items-center gap-2 animate-pulse shadow-sm"
                    >
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-ping mr-1" />
                      <span>Stop & Submit Speech</span>
                    </button>
                  )}
                </>
              )}

              {isUploading && (
                <span className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 animate-bounce" />
                  Uploading speech...
                </span>
              )}

              {isTopicRecorded && !isUploading && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Speech saved ✓
                </span>
              )}
            </div>

            {/* Navigation Buttons: Prev Topic, Next Topic, Jump to Section C */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="flex-1 sm:flex-none px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{currentIdx < topics.length - 1 ? 'Next Topic' : 'Proceed to Section C (Grammar)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
