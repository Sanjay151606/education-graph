import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { assessmentApi } from '../../services/api';
import { useOneTimeSpeech } from '../../hooks/useOneTimeSpeech';
import AssessmentNavBar from '../../components/assessment/AssessmentNavBar';
import {
  Headphones,
  Volume2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Lock,
  Sparkles,
  BookOpen,
  Send,
  Eye
} from 'lucide-react';

export default function SectionD() {
  const navigate = useNavigate();
  const location = useLocation();

  const sessionId =
    location.state?.sessionId || sessionStorage.getItem('bg_assessment_session_id') || 'assessment-session';

  const [rawItems, setRawItems] = useState([]);
  const [passages, setPassages] = useState([]);
  const [currentPassageIdx, setCurrentPassageIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [showQuestions, setShowQuestions] = useState(true); // default true so user is never blocked

  const { isPlaying, hasPlayed, speak, resetForNewItem } = useOneTimeSpeech();
  const questionStartTimeRef = useRef(Date.now());

  // Load Section D items with fallback passages
  useEffect(() => {
    const fetchSectionD = async () => {
      setIsLoading(true);
      try {
        const res = await assessmentApi.getSection(sessionId, 'D');
        const items = res.data || [];
        setRawItems(items);

        // Group into passages and sub-questions
        const passageGroups = {};
        items.forEach((it) => {
          const gId = it.passage_group_id || 'default';
          if (!passageGroups[gId]) {
            passageGroups[gId] = { passageItem: null, questions: [] };
          }
          if (it.options && it.options.length > 0) {
            passageGroups[gId].questions.push(it);
          } else {
            passageGroups[gId].passageItem = it;
          }
        });

        const formatted = Object.values(passageGroups).filter((g) => g.passageItem && g.questions.length > 0);
        if (formatted.length > 0) {
          setPassages(formatted);
        } else {
          setPassages([
            {
              passageItem: {
                id: 'sec-d-p-1',
                prompt_text: 'Deep-sea exploration has expanded dramatically over the past two decades. Advanced submersibles allow marine scientists to map previously inaccessible underwater ecosystems, discovering hundreds of bioluminescent species surviving without sunlight.',
              },
              questions: [
                { id: 'sec-d-p1-q1', prompt_text: 'What major advancement has occurred over the last two decades?', options: ['Underwater exploration submersibles', 'Commercial fishing fleets', 'Deep-sea tourist resorts', 'Surface satellite imaging'] },
                { id: 'sec-d-p1-q2', prompt_text: 'How do the newly discovered marine species survive?', options: ['Without natural sunlight', 'By migrating to shallow waters', 'Only in warm tropical zones', 'By feeding on surface plankton'] },
              ],
            },
            {
              passageItem: {
                id: 'sec-d-p-2',
                prompt_text: 'Renewable energy systems, particularly solar photovoltaics and wind turbines, have seen substantial efficiency improvements and manufacturing cost reductions. These clean technologies now provide over 30% of electric power in multiple developed regions.',
              },
              questions: [
                { id: 'sec-d-p2-q1', prompt_text: 'Which renewable technologies are explicitly highlighted?', options: ['Solar photovoltaics and wind turbines', 'Geothermal and biomass', 'Nuclear fission reactors', 'Coal and natural gas'] },
                { id: 'sec-d-p2-q2', prompt_text: 'What proportion of electric power is currently supplied in multiple regions?', options: ['Over 30%', 'Less than 10%', 'Exactly 50%', 'Over 90%'] },
              ],
            },
          ]);
        }
      } catch (err) {
        console.warn('Error fetching Section D, using fallback passages:', err);
        setPassages([
          {
            passageItem: {
              id: 'sec-d-p-1',
              prompt_text: 'Deep-sea exploration has expanded dramatically over the past two decades. Advanced submersibles allow marine scientists to map previously inaccessible underwater ecosystems, discovering hundreds of bioluminescent species surviving without sunlight.',
            },
            questions: [
              { id: 'sec-d-p1-q1', prompt_text: 'What major advancement has occurred over the last two decades?', options: ['Underwater exploration submersibles', 'Commercial fishing fleets', 'Deep-sea tourist resorts', 'Surface satellite imaging'] },
              { id: 'sec-d-p1-q2', prompt_text: 'How do the newly discovered marine species survive?', options: ['Without natural sunlight', 'By migrating to shallow waters', 'Only in warm tropical zones', 'By feeding on surface plankton'] },
            ],
          },
          {
            passageItem: {
              id: 'sec-d-p-2',
              prompt_text: 'Renewable energy systems, particularly solar photovoltaics and wind turbines, have seen substantial efficiency improvements and manufacturing cost reductions. These clean technologies now provide over 30% of electric power in multiple developed regions.',
            },
            questions: [
              { id: 'sec-d-p2-q1', prompt_text: 'Which renewable technologies are explicitly highlighted?', options: ['Solar photovoltaics and wind turbines', 'Geothermal and biomass', 'Nuclear fission reactors', 'Coal and natural gas'] },
              { id: 'sec-d-p2-q2', prompt_text: 'What proportion of electric power is currently supplied in multiple regions?', options: ['Over 30%', 'Less than 10%', 'Exactly 50%', 'Over 90%'] },
            ],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSectionD();
  }, [sessionId]);

  const currentPassageGroup = passages[currentPassageIdx] || null;
  const currentPassage = currentPassageGroup?.passageItem || null;
  const currentQ = currentPassageGroup?.questions[currentQuestionIdx] || null;

  // Reset playback on passage change
  useEffect(() => {
    if (!currentPassage) return;

    resetForNewItem();
    setShowQuestions(true);
    setCurrentQuestionIdx(0);
  }, [currentPassageIdx, currentPassage, resetForNewItem]);

  useEffect(() => {
    questionStartTimeRef.current = Date.now();
    setSaveStatus(answers[currentQ?.id] ? 'Saved' : '');
  }, [currentQuestionIdx, currentQ]);

  const handlePlayPassageAudio = () => {
    if (!currentPassage || isPlaying || hasPlayed) return;

    speak(currentPassage.prompt_text, { rate: 0.95 }, () => {
      setShowQuestions(true);
    });
  };

  const handleSelectOption = async (option) => {
    if (!currentQ) return;

    const responseTimeMs = Date.now() - questionStartTimeRef.current;
    const newAnswers = { ...answers, [currentQ.id]: option };
    setAnswers(newAnswers);
    sessionStorage.setItem('bg_assessment_section_d_answers', JSON.stringify(newAnswers));

    setSaveStatus('Saving...');
    try {
      await assessmentApi.respond(sessionId, {
        item_id: currentQ.id,
        mcq_choice: option,
        response_time_ms: responseTimeMs,
      });
      setSaveStatus('Saved ✓');
    } catch (err) {
      console.warn('Saved locally for demo:', err);
      setSaveStatus('Saved locally ✓');
    }
  };

  const handleNextQuestion = async () => {
    if (!currentPassageGroup) return;

    if (currentQuestionIdx < currentPassageGroup.questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else if (currentPassageIdx < passages.length - 1) {
      setCurrentPassageIdx((prev) => prev + 1);
    } else {
      await handleCompleteAssessment();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    } else if (currentPassageIdx > 0) {
      const prevPassage = passages[currentPassageIdx - 1];
      setCurrentPassageIdx((prev) => prev - 1);
      setCurrentQuestionIdx(prevPassage.questions.length - 1);
    }
  };

  const handleCompleteAssessment = async () => {
    setIsSubmittingFinal(true);
    try {
      await assessmentApi.complete(sessionId);
      navigate('/assessment/results', { state: { sessionId } });
    } catch (err) {
      console.warn('Redirecting to results page:', err);
      navigate('/assessment/results', { state: { sessionId } });
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-medium text-sm">Loading Section D Listening Passages...</p>
        </div>
      </div>
    );
  }

  if (!currentPassageGroup || !currentPassage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4 max-w-md p-6 bg-white rounded-2xl border border-slate-200">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="text-slate-700 font-semibold">No passages found for Section D.</p>
          <button
            onClick={() => navigate('/assessment')}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold"
          >
            Return to Assessment Intro
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = passages.reduce((acc, p) => acc + p.questions.length, 0);
  const answeredCount = Object.keys(answers).length;
  const globalQNum =
    passages.slice(0, currentPassageIdx).reduce((acc, p) => acc + p.questions.length, 0) +
    currentQuestionIdx +
    1;

  const isLastQuestionOverall =
    currentPassageIdx === passages.length - 1 &&
    currentQuestionIdx === currentPassageGroup.questions.length - 1;

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Global Assessment Section Navigation Bar */}
        <AssessmentNavBar currentSection="D" sessionId={sessionId} />

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg">
                🅳 Section D
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                Passage {currentPassageIdx + 1} of {passages.length}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Listening Comprehension
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Question {globalQNum} of {totalQuestions} • {answeredCount} Answered
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl text-purple-800 font-bold text-xs flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-purple-600" />
              <span>{Math.round((answeredCount / (totalQuestions || 1)) * 100)}% Complete</span>
            </div>
          </div>
        </div>

        {/* Passage Selector Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2.5 px-1">
            <span>Passage Audio & Questions:</span>
            <span>Passage {currentPassageIdx + 1} of {passages.length}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {passages.map((p, idx) => {
              const isCurrent = idx === currentPassageIdx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCurrentPassageIdx(idx);
                    setCurrentQuestionIdx(0);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                    isCurrent
                      ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-300 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Passage {idx + 1} ({p.questions.length} Qs)</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Listening Control Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Headphones className="w-4 h-4 text-purple-600" />
              <span>Passage Audio Player</span>
            </div>

            {hasPlayed && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Passage Audio Played
              </span>
            )}
          </div>

          <div className="p-6 bg-purple-50/60 border border-purple-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base">
                Passage {currentPassageIdx + 1}
              </h3>
              <p className="text-xs text-slate-600">
                {isPlaying
                  ? 'Audio is playing... Listen attentively.'
                  : hasPlayed
                  ? 'Audio finished. Review the comprehension questions below.'
                  : 'Click the button to listen to the passage.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handlePlayPassageAudio}
              disabled={isPlaying}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-bounce' : ''}`} />
              <span>{isPlaying ? 'Playing Audio...' : hasPlayed ? 'Replay Passage Audio' : 'Play Passage Audio'}</span>
            </button>
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">

            {/* Question Header & Sub-navigator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Passage {currentPassageIdx + 1} • Question {currentQuestionIdx + 1} of {currentPassageGroup.questions.length}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  {currentQ.prompt_text}
                </h2>
              </div>

              {saveStatus && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 self-start">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {saveStatus}
                </span>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(currentQ.options || []).map((option, idx) => {
                const isSelected = answers[currentQ.id] === option;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(option)}
                    className={`p-4 rounded-xl border text-left font-semibold text-sm transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-200 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-500 border-slate-300'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Question Nav Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handlePrevQuestion}
                disabled={currentPassageIdx === 0 && currentQuestionIdx === 0}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleNextQuestion}
                disabled={isSubmittingFinal}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSubmittingFinal ? (
                  <span>Submitting Test...</span>
                ) : isLastQuestionOverall ? (
                  <>
                    <span>Submit & View Results</span>
                    <Send className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Next Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
