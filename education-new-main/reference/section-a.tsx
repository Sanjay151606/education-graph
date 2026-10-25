'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// 18 Read Aloud Questions (increasing difficulty)
const readAloudQuestions = [
  { id: 1, text: 'The vibrant flowers bloomed in the garden.', timer: 15 },
  { id: 2, text: 'Technology has significantly changed how people communicate today.', timer: 15 },
  { id: 3, text: 'The conference will be held next month in the downtown convention center.', timer: 18 },
  { id: 4, text: 'Effective communication skills are essential for professional success in any field.', timer: 18 },
  { id: 5, text: 'Global warming is becoming a serious concern for scientists and policymakers worldwide.', timer: 18 },
  { id: 6, text: 'The company announced a new initiative to promote sustainability and reduce carbon emissions.', timer: 20 },
  { id: 7, text: 'Despite the heavy rain, the event continued as planned with enthusiastic participation from attendees.', timer: 20 },
  { id: 8, text: 'Artificial intelligence is transforming industries by automating complex tasks and improving efficiency.', timer: 20 },
  { id: 9, text: 'The research team discovered groundbreaking evidence that could revolutionize our understanding of climate patterns.', timer: 20 },
  { id: 10, text: 'Customer satisfaction remains our top priority, and we continuously strive to exceed expectations through innovative solutions.', timer: 20 },
  { id: 11, text: 'The digital transformation has enabled businesses to reach global markets, streamline operations, and enhance customer experiences through data-driven insights.', timer: 20 },
  { id: 12, text: 'Educational institutions are adopting new teaching methodologies that emphasize critical thinking, creativity, and collaborative problem-solving skills.', timer: 20 },
  { id: 13, text: 'The healthcare industry is experiencing rapid advancements in medical technology, enabling early disease detection and personalized treatment plans for patients.', timer: 20 },
  { id: 14, text: 'Sustainable development requires balancing economic growth with environmental protection, ensuring that future generations inherit a healthy planet with abundant natural resources.', timer: 20 },
  { id: 15, text: 'Cross-cultural communication plays a vital role in international business, requiring professionals to understand diverse perspectives, customs, and communication styles to build successful partnerships.', timer: 20 },
  { id: 16, text: 'The rapid pace of technological innovation presents both opportunities and challenges for organizations, necessitating continuous learning and adaptation to remain competitive in the global marketplace.', timer: 20 },
  { id: 17, text: 'Leadership development programs focus on cultivating essential skills such as strategic thinking, emotional intelligence, and effective decision-making, preparing individuals to navigate complex organizational challenges.', timer: 20 },
  { id: 18, text: 'The integration of renewable energy sources into existing power grids requires substantial infrastructure investments, policy reforms, and technological innovations to ensure reliable, sustainable electricity supply for growing populations.', timer: 20 },
]

// 5 Listen and Repeat Questions
const listenRepeatQuestions = [
  { id: 19, text: 'The meeting has been rescheduled to Monday morning.', timer: 15 },
  { id: 20, text: 'Global warming is becoming a serious concern worldwide.', timer: 15 },
  { id: 21, text: 'Please submit your reports by the end of this week.', timer: 15 },
  { id: 22, text: 'The project deadline has been extended by two weeks.', timer: 15 },
  { id: 23, text: 'Customer feedback is essential for improving our services.', timer: 15 },
]

export default function SectionA() {
  const router = useRouter()
  const [currentQ, setCurrentQ] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const [isRecording, setIsRecording] = useState(false)
  const [audioPlayed, setAudioPlayed] = useState(false)
  const [recordingDone, setRecordingDone] = useState(false)
  const [tabSwitches, setTabSwitches] = useState(0)
  const [warnings, setWarnings] = useState<string[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null)

  const allQuestions = [...readAloudQuestions, ...listenRepeatQuestions]
  const question = allQuestions[currentQ]
  const isListenRepeat = currentQ >= 18
  const questionType = isListenRepeat ? 'Listen and Repeat' : 'Read Aloud'

  useEffect(() => {
    checkMicrophone()
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1)
        setWarnings(prev => [...prev, '⚠️ Tab switch detected! Stay on this page.'])
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    setTimeLeft(question.timer)
    setAudioPlayed(false)
    setRecordingDone(false)
    setIsPlaying(false)
    
    const answers = JSON.parse(localStorage.getItem('answers') || '{}')
    if (answers.sectionA?.[question.id]) {
      setRecordingDone(true)
    }
  }, [currentQ])

  useEffect(() => {
    if (timeLeft > 0 && !isRecording) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timeLeft, isRecording])

  useEffect(() => {
    const interval = setInterval(() => {
      saveProgress()
    }, 3000)
    return () => clearInterval(interval)
  }, [currentQ])

  const checkMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
    } catch (err) {
      setWarnings(prev => [...prev, '🎤 Microphone access denied! Please enable it.'])
    }
  }

  const playAudioSentence = () => {
    if (audioPlayed || !isListenRepeat) return
    
    setIsPlaying(true)
    const utterance = new SpeechSynthesisUtterance(question.text)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1
    
    utterance.onend = () => {
      setAudioPlayed(true)
      setIsPlaying(false)
    }
    
    speechSynthRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const startRecording = async () => {
    if (isRecording || recordingDone) return
    if (isListenRepeat && !audioPlayed) {
      setWarnings(prev => [...prev, '⚠️ Please play the audio first!'])
      return
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await uploadAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      setWarnings(prev => [...prev, '❌ Failed to start recording. Check microphone.'])
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setRecordingDone(true)
    }
  }

  const uploadAudio = async (blob: Blob) => {
    const formData = new FormData()
    formData.append('audio', blob, `section-a-q${question.id}.webm`)
    formData.append('questionId', `a-${question.id}`)

    try {
      const response = await fetch('/api/uploadAudio', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      
      const answers = JSON.parse(localStorage.getItem('answers') || '{}')
      answers.sectionA = answers.sectionA || {}
      answers.sectionA[question.id] = {
        fileId: data.fileId,
        timestamp: new Date().toISOString(),
        type: questionType
      }
      localStorage.setItem('answers', JSON.stringify(answers))
    } catch (err) {
      setWarnings(prev => [...prev, '❌ Failed to upload audio. Please try again.'])
    }
  }

  const saveProgress = () => {
    const progress = {
      section: 'A',
      currentQuestion: currentQ,
      tabSwitches,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('progress', JSON.stringify(progress))
  }

  const nextQuestion = () => {
    if (currentQ < allQuestions.length - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      router.push('/section-b')
    }
  }

  const progress = ((currentQ + 1) / allQuestions.length) * 100

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="test-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🅰️ Section A</h1>
              <p className="text-gray-600">Reading & Listening</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Question</div>
              <div className="text-2xl font-bold text-blue-600">{currentQ + 1} / 23</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Read Aloud: 1-18</span>
              <span>Listen & Repeat: 19-23</span>
            </div>
          </div>

          {/* Question Type Badge */}
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold mb-4">
            {questionType} - Question {currentQ + 1}
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mb-6 space-y-2">
            {warnings.slice(-3).map((w, i) => (
              <div key={i} className="warning-box">
                {w}
              </div>
            ))}
          </div>
        )}

        {/* Timer */}
        <div className="test-card mb-6">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">Time Remaining</div>
            <div className="timer-display">
              {timeLeft}s
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="test-card mb-6">
          {!isListenRepeat ? (
            <>
              <h2 className="text-xl font-bold mb-4 text-gray-900">
                📖 Read the following text aloud:
              </h2>
              <div className="question-text">
                {question.text}
              </div>
              <p className="text-sm text-gray-600 mt-4">
                💡 Read clearly and naturally. You have {question.timer} seconds.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-4 text-gray-900">
                🎧 Listen and repeat exactly what you hear:
              </h2>
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300">
                <button
                  onClick={playAudioSentence}
                  disabled={audioPlayed || isPlaying}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                    audioPlayed 
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                      : isPlaying
                      ? 'bg-yellow-500 text-white'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isPlaying ? '🔊 Playing... Listen Carefully' : audioPlayed ? '✓ Audio Played (No Replay)' : '▶️ Play Audio Once'}
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                ⚠️ Audio plays ONCE only. Listen carefully and repeat exactly.
              </p>
            </>
          )}
        </div>

        {/* Recording Controls */}
        <div className="test-card mb-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">🎤 Your Recording:</h3>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={startRecording}
              disabled={isRecording || recordingDone || (isListenRepeat && !audioPlayed)}
              className={`flex-1 min-w-[200px] py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                isRecording || recordingDone || (isListenRepeat && !audioPlayed)
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isRecording ? '🔴 Recording...' : recordingDone ? '✓ Recorded' : '🎤 Start Recording'}
            </button>
            
            {isRecording && (
              <button
                onClick={stopRecording}
                className="flex-1 min-w-[200px] btn-secondary py-4 text-lg"
              >
                ⏹️ Stop Recording
              </button>
            )}
          </div>

          {isRecording && (
            <div className="mt-4 flex items-center justify-center gap-3 p-4 bg-red-50 rounded-lg border-2 border-red-300">
              <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
              <span className="text-red-700 font-semibold text-lg">Recording in progress...</span>
            </div>
          )}

          {recordingDone && (
            <div className="mt-4 success-box">
              ✓ Recording uploaded successfully! Click Next to continue.
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Tab switches: {tabSwitches}
          </div>
          <button
            onClick={nextQuestion}
            disabled={!recordingDone}
            className="btn-primary text-lg px-8 py-4"
          >
            {currentQ < allQuestions.length - 1 ? 'Next Question →' : 'Go to Section B →'}
          </button>
        </div>
      </div>
    </div>
  )
}
