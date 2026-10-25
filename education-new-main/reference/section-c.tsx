'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Grammar questions organized by type
const grammarQuestions = [
  // 1. Verb Forms (8 questions)
  { id: 1, category: 'Verb Forms', text: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answer: 'goes' },
  { id: 2, category: 'Verb Forms', text: 'They ___ playing football now.', options: ['is', 'are', 'was', 'were'], answer: 'are' },
  { id: 3, category: 'Verb Forms', text: 'He ___ his homework yesterday.', options: ['do', 'does', 'did', 'done'], answer: 'did' },
  { id: 4, category: 'Verb Forms', text: 'We ___ to the park tomorrow.', options: ['go', 'goes', 'will go', 'went'], answer: 'will go' },
  { id: 5, category: 'Verb Forms', text: 'She ___ a book when I called.', options: ['read', 'reads', 'was reading', 'is reading'], answer: 'was reading' },
  { id: 6, category: 'Verb Forms', text: 'They ___ in this city since 2010.', options: ['live', 'lives', 'have lived', 'had lived'], answer: 'have lived' },
  { id: 7, category: 'Verb Forms', text: 'The children ___ in the garden.', options: ['play', 'plays', 'playing', 'are playing'], answer: 'are playing' },
  { id: 8, category: 'Verb Forms', text: 'He ___ his keys somewhere.', options: ['lose', 'loses', 'has lost', 'losing'], answer: 'has lost' },

  // 2. Tenses (8 questions)
  { id: 9, category: 'Tenses', text: 'I ___ my work by 6 PM yesterday.', options: ['finish', 'finished', 'had finished', 'have finished'], answer: 'had finished' },
  { id: 10, category: 'Tenses', text: 'She ___ for two hours when I arrived.', options: ['waits', 'waited', 'has waited', 'had been waiting'], answer: 'had been waiting' },
  { id: 11, category: 'Tenses', text: 'By next year, I ___ my degree.', options: ['complete', 'completed', 'will complete', 'will have completed'], answer: 'will have completed' },
  { id: 12, category: 'Tenses', text: 'They ___ the project next month.', options: ['finish', 'finished', 'will finish', 'have finished'], answer: 'will finish' },
  { id: 13, category: 'Tenses', text: 'He ___ in this company for five years.', options: ['works', 'worked', 'has worked', 'is working'], answer: 'has worked' },
  { id: 14, category: 'Tenses', text: 'The train ___ before we reached the station.', options: ['left', 'leaves', 'had left', 'has left'], answer: 'had left' },
  { id: 15, category: 'Tenses', text: 'I ___ him since last week.', options: ["don't see", "didn't see", "haven't seen", "hadn't seen"], answer: "haven't seen" },
  { id: 16, category: 'Tenses', text: 'She ___ her homework when her friend called.', options: ['does', 'did', 'was doing', 'has done'], answer: 'was doing' },

  // 3. Articles (6 questions)
  { id: 17, category: 'Articles', text: 'He is ___ honest man.', options: ['a', 'an', 'the', 'no article'], answer: 'an' },
  { id: 18, category: 'Articles', text: '___ Himalayas are the highest mountains.', options: ['A', 'An', 'The', 'No article'], answer: 'The' },
  { id: 19, category: 'Articles', text: 'She plays ___ piano beautifully.', options: ['a', 'an', 'the', 'no article'], answer: 'the' },
  { id: 20, category: 'Articles', text: 'I need ___ information about the course.', options: ['a', 'an', 'the', 'no article'], answer: 'no article' },
  { id: 21, category: 'Articles', text: 'He gave me ___ useful advice.', options: ['a', 'an', 'the', 'no article'], answer: 'no article' },
  { id: 22, category: 'Articles', text: 'She is ___ best student in the class.', options: ['a', 'an', 'the', 'no article'], answer: 'the' },

  // 4. Voice Change (6 questions)
  { id: 23, category: 'Voice Change', text: 'Active: "They are building a new bridge." Passive:', options: ['A new bridge is being built by them.', 'A new bridge was built by them.', 'A new bridge is built by them.', 'A new bridge has been built by them.'], answer: 'A new bridge is being built by them.' },
  { id: 24, category: 'Voice Change', text: 'Active: "She will write a letter." Passive:', options: ['A letter will be written by her.', 'A letter is written by her.', 'A letter was written by her.', 'A letter has been written by her.'], answer: 'A letter will be written by her.' },
  { id: 25, category: 'Voice Change', text: 'Passive: "The cake was baked by Mary." Active:', options: ['Mary bakes the cake.', 'Mary baked the cake.', 'Mary is baking the cake.', 'Mary has baked the cake.'], answer: 'Mary baked the cake.' },
  { id: 26, category: 'Voice Change', text: 'Active: "The teacher teaches English." Passive:', options: ['English is taught by the teacher.', 'English was taught by the teacher.', 'English has been taught by the teacher.', 'English will be taught by the teacher.'], answer: 'English is taught by the teacher.' },
  { id: 27, category: 'Voice Change', text: 'Passive: "The letter has been written by John." Active:', options: ['John writes the letter.', 'John wrote the letter.', 'John has written the letter.', 'John will write the letter.'], answer: 'John has written the letter.' },
  { id: 28, category: 'Voice Change', text: 'Active: "They completed the project." Passive:', options: ['The project is completed by them.', 'The project was completed by them.', 'The project has been completed by them.', 'The project will be completed by them.'], answer: 'The project was completed by them.' },

  // 5. Mixed Grammar (6 questions)
  { id: 29, category: 'Prepositions', text: 'She is good ___ mathematics.', options: ['in', 'at', 'on', 'with'], answer: 'at' },
  { id: 30, category: 'Prepositions', text: 'They arrived ___ the airport on time.', options: ['in', 'at', 'on', 'to'], answer: 'at' },
  { id: 31, category: 'Subject-Verb Agreement', text: 'Neither John nor his friends ___ coming.', options: ['is', 'are', 'was', 'were'], answer: 'are' },
  { id: 32, category: 'Subject-Verb Agreement', text: 'The team ___ playing well today.', options: ['is', 'are', 'was', 'were'], answer: 'is' },
  { id: 33, category: 'Sentence Correction', text: 'If I ___ rich, I would travel the world.', options: ['am', 'was', 'were', 'be'], answer: 'were' },
  { id: 34, category: 'Sentence Correction', text: 'She speaks English ___ than her brother.', options: ['good', 'better', 'best', 'well'], answer: 'better' },
]

export default function SectionC() {
  const router = useRouter()
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [answers, setAnswers] = useState<Record<number, string>>({})

  const question = grammarQuestions[currentQ]

  useEffect(() => {
    const savedAnswers = JSON.parse(localStorage.getItem('answers') || '{}')
    if (savedAnswers.sectionC) {
      setAnswers(savedAnswers.sectionC)
    }
  }, [])

  useEffect(() => {
    setSelectedAnswer(answers[question.id] || '')
  }, [currentQ, answers])

  useEffect(() => {
    const interval = setInterval(() => {
      const progress = {
        section: 'C',
        currentQuestion: currentQ,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('progress', JSON.stringify(progress))
    }, 3000)
    return () => clearInterval(interval)
  }, [currentQ])

  const saveAnswer = (answer: string) => {
    setSelectedAnswer(answer)
    const newAnswers = { ...answers, [question.id]: answer }
    setAnswers(newAnswers)
    
    const allAnswers = JSON.parse(localStorage.getItem('answers') || '{}')
    allAnswers.sectionC = newAnswers
    localStorage.setItem('answers', JSON.stringify(allAnswers))
  }

  const nextQuestion = () => {
    if (currentQ < grammarQuestions.length - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      router.push('/section-d')
    }
  }

  const prevQuestion = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1)
    }
  }

  const progress = ((currentQ + 1) / grammarQuestions.length) * 100
  const answeredCount = Object.keys(answers).length

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="test-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🅾️ Section C</h1>
              <p className="text-gray-600">Grammar</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Question</div>
              <div className="text-2xl font-bold text-purple-600">{currentQ + 1} / 34</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Answered: {answeredCount}/34</span>
              <span>Progress: {Math.round(progress)}%</span>
            </div>
          </div>

          {/* Category Badge */}
          <div className="inline-block px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-semibold">
            {question.category}
          </div>
        </div>

        {/* Question */}
        <div className="test-card mb-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                {currentQ + 1}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {question.text}
              </h2>
            </div>
          </div>
          
          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                  selectedAnswer === option
                    ? 'border-purple-600 bg-purple-50 shadow-lg'
                    : 'border-gray-300 hover:border-purple-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="answer"
                  value={option}
                  checked={selectedAnswer === option}
                  onChange={(e) => saveAnswer(e.target.value)}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                />
                <span className={`ml-4 text-lg ${selectedAnswer === option ? 'font-semibold text-purple-900' : 'text-gray-700'}`}>
                  {option}
                </span>
                {selectedAnswer === option && (
                  <svg className="ml-auto w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </label>
            ))}
          </div>

          {selectedAnswer && (
            <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-400 rounded">
              <p className="text-green-800">✓ Answer saved automatically</p>
            </div>
          )}
        </div>

        {/* Category Progress */}
        <div className="test-card mb-6">
          <h3 className="font-bold text-gray-900 mb-3">Question Categories:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs text-gray-600">Verb Forms</div>
              <div className="text-lg font-bold text-blue-600">Q1-8</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xs text-gray-600">Tenses</div>
              <div className="text-lg font-bold text-green-600">Q9-16</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-xs text-gray-600">Articles</div>
              <div className="text-lg font-bold text-yellow-600">Q17-22</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-xs text-gray-600">Voice Change</div>
              <div className="text-lg font-bold text-red-600">Q23-28</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-xs text-gray-600">Mixed</div>
              <div className="text-lg font-bold text-purple-600">Q29-34</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={prevQuestion}
            disabled={currentQ === 0}
            className={`btn-secondary px-6 py-3 ${currentQ === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            ← Previous
          </button>
          
          <div className="text-sm text-gray-600">
            {answeredCount} of 34 answered
          </div>
          
          <button
            onClick={nextQuestion}
            disabled={!selectedAnswer}
            className="btn-primary px-8 py-3"
          >
            {currentQ < grammarQuestions.length - 1 ? 'Next →' : 'Go to Section D →'}
          </button>
        </div>
      </div>
    </div>
  )
}
