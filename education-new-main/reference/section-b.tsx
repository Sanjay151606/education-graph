'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const topics = [
  {
    id: 1,
    topic: 'Importance of Healthy Eating',
    hints: [
      'What does healthy eating mean to you?',
      'How does diet affect physical and mental health?',
      'What are some challenges in maintaining a healthy diet?',
      'What advice would you give to someone starting a healthy eating journey?'
    ]
  },
  {
    id: 2,
    topic: 'Impact of Technology on Communication',
    hints: [
      'How has technology changed the way we communicate?',
      'What are the advantages of digital communication?',
      'What are the disadvantages or challenges?',
      'Do you think technology has improved or harmed personal relationships?'
    ]
  },
  {
    id: 3,
    topic: 'Advantages and Disadvantages of Social Media',
    hints: [
      'What are the main benefits of social media?',
      'What negative impacts have you observed?',
      'How does social media affect young people?',
      'Should there be more regulation of social media platforms?'
    ]
  },
  {
    id: 4,
    topic: 'A Memorable Day in Your Life',
    hints: [
      'When and where did this memorable day occur?',
      'What made this day special or unforgettable?',
      'Who was with you and what did you do?',
      'How did this experience impact you or change your perspective?'
    ]
  }
]

export default function SectionB() {
  const router = useRouter()
  const [currentTask, setCurrentTask] = useState(0)
  const [phase, setPhase] = useState<'prep' | 'speak'>('prep')
  const [timeLeft, setTimeLeft] = useState(90)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDone, setRecordingDone] = useState(false)
  const [showHints, setShowHints] = useState(true)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const task = topics[currentTask]

  useEffect(() => {
    setPhase('prep')
    setTimeLeft(90)
    setRecordingDone(false)
    setShowHints(true)
    
    const answers = JSON.parse(localStorage.getItem('answers') || '{}')
    if (answers.sectionB?.[task.id]) {
      setRecordingDone(true)
    }
  }, [currentTask])

  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    } else if (phase === 'prep') {
      setPhase('speak')
      setTimeLeft(60)
    } else if (phase === 'speak' && isRecording) {
      stopSpeaking()
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timeLeft, phase])

  useEffect(() => {
    const interval = setInterval(() => {
      const progress = {
        section: 'B',
        currentTask,
        phase,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('progress', JSON.stringify(progress))
    }, 3000)
    return () => clearInterval(interval)
  }, [currentTask, phase])

  const startSpeaking = async () => {
    if (isRecording || recordingDone || phase !== 'speak') return
    
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
      alert('Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopSpeaking = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setRecordingDone(true)
    }
  }

  const uploadAudio = async (blob: Blob) => {
    const formData = new FormData()
    formData.append('audio', blob, `section-b-task${task.id}.webm`)
    formData.append('questionId', `b-${task.id}`)

    try {
      const response = await fetch('/api/uploadAudio', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      
      const answers = JSON.parse(localStorage.getItem('answers') || '{}')
      answers.sectionB = answers.sectionB || {}
      answers.sectionB[task.id] = {
        fileId: data.fileId,
        timestamp: new Date().toISOString(),
        topic: task.topic
      }
      localStorage.setItem('answers', JSON.stringify(answers))
    } catch (err) {
      alert('Failed to upload audio. Please try again.')
    }
  }

  const nextTask = () => {
    if (currentTask < topics.length - 1) {
      setCurrentTask(currentTask + 1)
    } else {
      router.push('/section-c')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = ((currentTask + 1) / topics.length) * 100

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="test-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🅱️ Section B</h1>
              <p className="text-gray-600">Speaking</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Task</div>
              <div className="text-2xl font-bold text-green-600">{currentTask + 1} / 4</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Phase Indicator */}
        <div className="test-card mb-6">
          <div className="flex items-center justify-center gap-8">
            <div className={`flex items-center gap-2 ${phase === 'prep' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                phase === 'prep' ? 'bg-blue-600 text-white' : 'bg-gray-300'
              }`}>
                1
              </div>
              <span className="font-semibold">Preparation</span>
            </div>
            <div className="flex-1 h-1 bg-gray-300 rounded">
              <div className={`h-full bg-blue-600 rounded transition-all ${phase === 'speak' ? 'w-full' : 'w-0'}`} />
            </div>
            <div className={`flex items-center gap-2 ${phase === 'speak' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                phase === 'speak' ? 'bg-green-600 text-white' : 'bg-gray-300'
              }`}>
                2
              </div>
              <span className="font-semibold">Speaking</span>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="test-card mb-6">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">
              {phase === 'prep' ? '⏱️ Preparation Time' : '🎤 Speaking Time'}
            </div>
            <div className={`text-6xl font-bold py-6 px-8 rounded-xl ${
              phase === 'prep' 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
            }`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {phase === 'prep' ? 'Use this time to organize your thoughts' : 'Speak continuously until time runs out'}
            </div>
          </div>
        </div>

        {/* Topic */}
        <div className="test-card mb-6">
          <div className="mb-4">
            <span className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold text-sm mb-4">
              Topic {currentTask + 1}
            </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
            {task.topic}
          </h2>
          
          {/* Hints Toggle */}
          <button
            onClick={() => setShowHints(!showHints)}
            className="w-full mb-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-blue-200 text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-900">💡 Hint Questions (Optional)</span>
              <svg 
                className={`w-5 h-5 text-blue-600 transition-transform ${showHints ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {showHints && (
            <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
              <ul className="space-y-3">
                {task.hints.map((hint, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </span>
                    <span className="text-gray-700">{hint}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Recording Controls */}
        {phase === 'prep' && (
          <div className="test-card mb-6">
            <div className="text-center p-8 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="text-6xl mb-4">🤔</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Preparation Phase</h3>
              <p className="text-gray-600">
                Use this time to organize your thoughts. Speaking will begin automatically when preparation time ends.
              </p>
            </div>
          </div>
        )}

        {phase === 'speak' && (
          <div className="test-card mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900">🎤 Record Your Response:</h3>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={startSpeaking}
                disabled={isRecording || recordingDone}
                className={`flex-1 min-w-[200px] py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                  isRecording || recordingDone
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isRecording ? '🔴 Recording...' : recordingDone ? '✓ Recorded' : '🎤 Start Speaking'}
              </button>
              
              {isRecording && (
                <button
                  onClick={stopSpeaking}
                  className="flex-1 min-w-[200px] btn-secondary py-4 text-lg"
                >
                  ⏹️ Stop Speaking
                </button>
              )}
            </div>

            {isRecording && (
              <div className="mt-4 flex items-center justify-center gap-3 p-6 bg-red-50 rounded-lg border-2 border-red-300">
                <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-red-700 font-semibold text-lg">Recording in progress... Speak continuously</span>
              </div>
            )}

            {recordingDone && (
              <div className="mt-4 success-box">
                ✓ Recording uploaded successfully! Click Next to continue.
              </div>
            )}

            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <p className="text-sm text-yellow-800">
                💡 <strong>Tip:</strong> Speak clearly and continuously. Use the hint questions to structure your response.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-end">
          <button
            onClick={nextTask}
            disabled={!recordingDone}
            className="btn-primary text-lg px-8 py-4"
          >
            {currentTask < topics.length - 1 ? 'Next Task →' : 'Go to Section C →'}
          </button>
        </div>
      </div>
    </div>
  )
}
