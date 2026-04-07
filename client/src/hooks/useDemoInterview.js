import { useState } from 'react'

export const DEMO_QUESTIONS = [
  {
    id: 1,
    question_text: 'Explain the difference between a stack and a queue. What are their time complexities for push/pop/enqueue/dequeue, and give a real-world use case for each?',
    topic_tags: ['Data Structures', 'Basics'],
    estimated_answer_time_sec: 120,
  },
  {
    id: 2,
    question_text: 'What is Big O notation? Explain the difference between O(n), O(n log n), and O(n²) with a concrete example algorithm for each.',
    topic_tags: ['Algorithms', 'Complexity'],
    estimated_answer_time_sec: 150,
  },
  {
    id: 3,
    question_text: 'How does a hash table handle collisions internally? Describe two different collision resolution strategies and their trade-offs.',
    topic_tags: ['Data Structures', 'Hashing'],
    estimated_answer_time_sec: 160,
  },
  {
    id: 4,
    question_text: 'Describe the merge sort algorithm step-by-step. What is its time and space complexity? Why is it preferred over quicksort in some scenarios?',
    topic_tags: ['Sorting', 'Divide & Conquer'],
    estimated_answer_time_sec: 180,
  },
  {
    id: 5,
    question_text: 'When would you choose a linked list over an array? Compare them in terms of time complexity for common operations, memory usage, and real-world applicability.',
    topic_tags: ['Data Structures', 'Trade-offs'],
    estimated_answer_time_sec: 150,
  },
]

export const DEMO_RESULT = {
  overall_score: 76,
  overall_assessment:
    'Strong demo performance! You demonstrated solid understanding of fundamental data structures and algorithms. Your answers showed conceptual clarity, though deeper edge-case analysis would strengthen them further.',
  strengths: [
    'Clear conceptual explanations with good examples',
    'Well-structured, organised answers',
    'Good intuition for time complexity basics',
  ],
  improvement_areas: [
    'Provide more precise space complexity analysis',
    'Discuss edge cases and failure scenarios',
    'Include more real-world application trade-offs',
  ],
  per_question: [
    { id: 1, score: 8, verdict: 'good', feedback: 'Clear distinction with appropriate use cases.' },
    { id: 2, score: 7, verdict: 'good', feedback: 'Correct Big O understanding; needed more depth on log n.' },
    { id: 3, score: 8, verdict: 'good', feedback: 'Both collision techniques with proper trade-off analysis.' },
    { id: 4, score: 7, verdict: 'good', feedback: 'Accurate merge sort but space complexity was incomplete.' },
    { id: 5, score: 9, verdict: 'excellent', feedback: 'Excellent trade-off analysis with practical scenarios.' },
  ],
}

export default function useDemoInterview() {
  const [started, setStarted] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [askedQuestions, setAskedQuestions] = useState([])
  const [busyState, setBusyState] = useState('idle')
  const [result, setResult] = useState(null)

  const total = DEMO_QUESTIONS.length
  const currentQuestion =
    started && busyState === 'answering' && currentIdx < total ? DEMO_QUESTIONS[currentIdx] : null
  const questionIndex = started ? currentIdx + 1 : 0
  const progressPercent = started ? Math.round((currentIdx / total) * 100) : 0
  const canAnswer = busyState === 'answering' && !!currentQuestion

  const _advance = () => {
    setTimeout(() => {
      const nextIdx = currentIdx + 1
      if (nextIdx >= total) {
        setBusyState('completed')
        setResult(DEMO_RESULT)
      } else {
        setCurrentIdx(nextIdx)
        setAskedQuestions((prev) =>
          prev.find((q) => q.id === DEMO_QUESTIONS[nextIdx].id)
            ? prev
            : [...prev, DEMO_QUESTIONS[nextIdx]]
        )
        setBusyState('answering')
      }
      setAnswer('')
    }, 1200)
  }

  const start = () => {
    setStarted(true)
    setBusyState('answering')
    setAskedQuestions([DEMO_QUESTIONS[0]])
  }

  const submitAnswer = () => {
    if (!canAnswer || !answer.trim()) return
    setBusyState('waiting-next')
    _advance()
  }

  const skipQuestion = () => {
    if (!canAnswer) return
    setBusyState('waiting-next')
    setAnswer('')
    _advance()
  }

  return {
    // shared shape with useInterview
    started,
    start,
    currentQuestion,
    questionIndex,
    totalQuestions: total,
    answer,
    setAnswer,
    askedQuestions,
    busyState,
    isBusyFlow: busyState === 'waiting-next',
    canAnswer,
    result,
    progressPercent,
    connection: started ? (busyState === 'completed' ? 'completed' : 'active') : 'disconnected',
    heartbeat: started ? 'live' : 'offline',
    activeMessage:
      busyState === 'waiting-next'
        ? 'Processing your answer...'
        : busyState === 'completed'
        ? 'Interview complete!'
        : 'Ready for your answer.',
    submitAnswer,
    skipQuestion,
    finishNow: () => {
      setBusyState('completed')
      setResult(DEMO_RESULT)
    },
    disconnect: () => {
      setStarted(false)
      setBusyState('idle')
      setResult(null)
      setCurrentIdx(0)
      setAskedQuestions([])
      setAnswer('')
    },
    error: '',
  }
}
