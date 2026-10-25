import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { assessmentApi } from '../../services/api';
import AssessmentNavBar from '../../components/assessment/AssessmentNavBar';
import {
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  BookmarkCheck,
  Sparkles,
  Layers
} from 'lucide-react';

export default function SectionC() {
  const navigate = useNavigate();
  const location = useLocation();

  const sessionId =
    location.state?.sessionId || sessionStorage.getItem('bg_assessment_session_id') || 'assessment-session';

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const questionStartTimeRef = useRef(Date.now());

  // Load Section C questions from API with fallback questions
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const res = await assessmentApi.getSection(sessionId, 'C');
        if (res.data && res.data.length > 0) {
          setQuestions(res.data);
        } else {
          setQuestions([
            { id: 'sec-c-mcq-1', section: 'C', item_type: 'grammar_mcq', sequence_index: 1, prompt_text: 'She ______ to the library every Wednesday after school.', options: ['goes', 'go', 'going', 'gone'] },
            { id: 'sec-c-mcq-2', section: 'C', item_type: 'grammar_mcq', sequence_index: 2, prompt_text: 'By the time the train arrived, we ______ for over two hours.', options: ['had been waiting', 'have waited', 'are waiting', 'waited'] },
            { id: 'sec-c-mcq-3', section: 'C', item_type: 'grammar_mcq', sequence_index: 3, prompt_text: 'He is ______ honest individual who always keeps his promises.', options: ['an', 'a', 'the', 'no article'] },
            { id: 'sec-c-mcq-4', section: 'C', item_type: 'grammar_mcq', sequence_index: 4, prompt_text: 'The architectural plans ______ by the lead designer yesterday.', options: ['were approved', 'was approved', 'approved', 'are approving'] },
            { id: 'sec-c-mcq-5', section: 'C', item_type: 'grammar_mcq', sequence_index: 5, prompt_text: 'Neither the teacher nor the students ______ aware of the schedule change.', options: ['were', 'was', 'is', 'are being'] },
          ]);
        }
      } catch (err) {
        console.warn('Error fetching Section C questions, using fallback set:', err);
        setQuestions([
          { id: 'sec-c-mcq-1', section: 'C', item_type: 'grammar_mcq', sequence_index: 1, prompt_text: 'She ______ to the library every Wednesday after school.', options: ['goes', 'go', 'going', 'gone'] },
          { id: 'sec-c-mcq-2', section: 'C', item_type: 'grammar_mcq', sequence_index: 2, prompt_text: 'By the time the train arrived, we ______ for over two hours.', options: ['had been waiting', 'have waited', 'are waiting', 'waited'] },
          { id: 'sec-c-mcq-3', section: 'C', item_type: 'grammar_mcq', sequence_index: 3, prompt_text: 'He is ______ honest individual who always keeps his promises.', options: ['an', 'a', 'the', 'no article'] },
          { id: 'sec-c-mcq-4', section: 'C', item_type: 'grammar_mcq', sequence_index: 4, prompt_text: 'The architectural plans ______ by the lead designer yesterday.', options: ['were approved', 'was approved', 'approved', 'are approving'] },
          { id: 'sec-c-mcq-5', section: 'C', item_type: 'grammar_mcq', sequence_index: 5, prompt_text: 'Neither the teacher nor the students ______ aware of the schedule change.', options: ['were', 'was', 'is', 'are being'] },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [sessionId]);

  const currentQ = questions[currentIdx] || null;

  useEffect(() => {
    questionStartTimeRef.current = Date.now();
    setSaveStatus(answers[currentQ?.id] ? 'Saved' : '');
  }, [currentIdx, currentQ]);

  const handleSelectOption = async (option) => {
    if (!currentQ || isSaving) return;

    const responseTimeMs = Date.now() - questionStartTimeRef.current;
    const newAnswers = { ...answers, [currentQ.id]: option };
    setAnswers(newAnswers);
    sessionStorage.setItem('bg_assessment_section_c_answers', JSON.stringify(newAnswers));

    setIsSaving(true);
    setSaveStatus('Saving...');
    try {
      await assessmentApi.respond(sessionId, {
        item_id: currentQ.id,
        mcq_choice: option,
        response_time_ms: responseTimeMs,
      });
      setSaveStatus('Answer saved ✓');
    } catch (err) {
      console.warn('Saved locally for demo:', err);
      setSaveStatus('Saved locally ✓');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      navigate('/assessment/section-d', { state: { sessionId } });
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
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-medium text-sm">Loading Section C Grammar questions...</p>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4 max-w-md p-6 bg-white rounded-2xl border border-slate-200">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="text-slate-700 font-semibold">No questions found for Section C.</p>
          <button
            onClick={() => navigate('/assessment')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold"
          >
            Return to Assessment Intro
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  const getCategoryName = (idx) => {
    if (idx < 8) return 'Verb Forms';
    if (idx < 16) return 'Tenses';
    if (idx < 22) return 'Articles';
    if (idx < 28) return 'Voice Change';
    return 'Mixed Grammar & Agreement';
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Global Assessment Section Navigation Bar */}
        <AssessmentNavBar currentSection="C" sessionId={sessionId} />

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg">
                🅾️ Section C
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {getCategoryName(currentIdx)}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Grammar & Structure Assessment
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Question {currentIdx + 1} of {questions.length} • {answeredCount} of {questions.length} answered
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-xs flex items-center gap-1.5">
              <BookmarkCheck className="w-4 h-4 text-emerald-600" />
              <span>{progressPercent}% Complete</span>
            </div>
          </div>
        </div>

        {/* Question Palette / Quick Nav */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-3 px-1">
            <span>Jump directly to question in Section C:</span>
            <span>{answeredCount}/{questions.length} Completed</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentIdx;
              return (
                <button
                  key={q.id || idx}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center border ${
                    isCurrent
                      ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-300'
                      : isAnswered
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Question Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">

          {/* Question Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
              <span>Question {currentIdx + 1}</span>
              {saveStatus && (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {saveStatus}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {currentQ.prompt_text}
            </h2>
          </div>

          {/* Multiple Choice Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {(currentQ.options || []).map((option, idx) => {
              const isSelected = answers[currentQ.id] === option;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  className={`p-4 rounded-xl border text-left font-semibold text-sm transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-200 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-500 border-slate-300'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Navigation */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              <span>{currentIdx < questions.length - 1 ? 'Next Question' : 'Proceed to Section D (Listening)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
