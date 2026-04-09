import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

function deriveWsUrl() {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
  // Convert http(s) to ws(s)
  return base.replace(/^http/, 'ws') + '/interview/ws'
}

export const DEFAULT_WS_URL = deriveWsUrl()

export const BLOOM_LEVELS = [
  'L1 - Remember',
  'L2 - Understand',
  'L3 - Apply',
  'L4 - Analyze',
  'L5 - Evaluate',
  'L6 - Create',
  'L7 - Innovate',
  'Mixed',
]

export const SUBJECTS = [
  'Data Structures & Algorithms (DSA)',
  'Database Management Systems (DBMS)',
  'Operating Systems (OS)',
  'Computer Networks (CN)',
  'Computer Architecture',
  'Compiler Design',
  'Theory of Computation',
  'Parallel Computing',
  'Distributed Systems',
  'Programming Language Fundamentals',
  'Object-Oriented Programming (OOP)',
  'System Design',
  'Software Engineering',
  'Web Development',
  'Mobile Application Development',
  'DevOps',
  'Cloud Computing',
  'Artificial Intelligence (AI)',
  'Machine Learning (ML)',
  'Data Science',
  'Cybersecurity',
  'Blockchain Technology',
  'Human-Computer Interaction (HCI)',
  'Embedded Systems',
  'Augmented & Virtual Reality (AR/VR)',
  'Circuit Theory',
  'Electrical Machines',
  'Power Systems',
  'Control Systems',
  'Power Electronics',
  'Analog Electronics',
  'Digital Electronics',
  'Signals & Systems',
  'Measurement & Instrumentation',
  'Sensors & Transducers',
  'Process Control',
  'Industrial Automation',
  'Communication Systems',
  'Electromagnetics',
  'Microprocessors & Microcontrollers',
  'VLSI Design',
  'Digital Signal Processing',
  'Engineering Mechanics',
  'Thermodynamics',
  'Fluid Mechanics',
  'Heat Transfer',
  'Theory of Machines',
  'Machine Design',
  'Manufacturing Engineering',
  'Industrial Engineering',
  'Structural Analysis',
  'Geotechnical Engineering',
  'Environmental Engineering',
  'Transportation Engineering',
  'Surveying',
  'Construction Engineering',
  'Human Anatomy & Physiology',
  'Biomedical Instrumentation',
  'Medical Imaging',
  'Biomaterials',
  'Biomechanics',
  'Bio-signal Processing',
  'Rehabilitation Engineering',
  'Manufacturing Processes',
  'Operations Research',
  'Production Planning & Control',
  'Quality Control',
  'Supply Chain Management',
  'Other / Custom Subject'
]

export const STAGE_COPY = {
  idle: 'Ready to start your interview.',
  connecting: 'Connecting to the interview service...',
  generating: 'Generating your interview questions...',
  'waiting-question': 'Loading your first question...',
  answering: 'Question ready. Type your answer below.',
  'waiting-next': 'Processing your answer...',
  finishing: 'Finalizing your evaluation report...',
  completed: 'Interview completed. Review your results below.',
  error: 'Connection issue detected. Please retry.',
}

export default function useInterview() {
  const [form, setForm] = useState({
    subject: SUBJECTS[0],
    subject_description: 'Data structures and algorithms for solving real-world engineering problems.',
    query: '',
    difficulty: 'medium',
    bloom_level: 'L3 - Apply',
    bloom_mode: 'Single',
    n: 5,
    real_world_required: true,
  })

  const [socketUrl, setSocketUrl] = useState(DEFAULT_WS_URL)
  const [connection, setConnection] = useState('disconnected')
  const [sessionId, setSessionId] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [answer, setAnswer] = useState('')
  const [submittedAnswers, setSubmittedAnswers] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [timeline, setTimeline] = useState([])
  const [busyState, setBusyState] = useState('idle')
  const [heartbeat, setHeartbeat] = useState('offline')
  const [lastServerTime, setLastServerTime] = useState('')
  const [endsAt, setEndsAt] = useState(null)

  const wsRef = useRef(null)

  const canStart = useMemo(
    () => form.subject.trim().length > 1 && connection !== 'connecting' && connection !== 'active',
    [form.subject, connection]
  )

  const progressPercent = useMemo(() => {
    if (!totalQuestions) return 0
    return Math.min(100, Math.round((questionIndex / totalQuestions) * 100))
  }, [questionIndex, totalQuestions])

  const isBusyFlow = ['connecting', 'generating', 'waiting-question', 'waiting-next', 'finishing'].includes(busyState)
  const canAnswer = !!currentQuestion && busyState === 'answering' && connection === 'active'
  const activeMessage = STAGE_COPY[busyState] || STAGE_COPY.idle

  const logEvent = useCallback((message) => {
    setTimeline((prev) => {
      const stamp = new Date().toLocaleTimeString()
      return [`${stamp} - ${message}`, ...prev].slice(0, 20)
    })
  }, [])

  const cleanupSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen = null
      wsRef.current.onmessage = null
      wsRef.current.onerror = null
      wsRef.current.onclose = null
      wsRef.current.close()
      wsRef.current = null
    }
    setHeartbeat('offline')
  }, [])

  const resetInterviewState = useCallback(() => {
    setCurrentQuestion(null)
    setQuestionIndex(0)
    setTotalQuestions(0)
    setAnswer('')
    setSubmittedAnswers([])
    setResult(null)
    setSessionId('')
    setError('')
    setTimeline([])
    setBusyState('idle')
    setHeartbeat('offline')
    setLastServerTime('')
    setEndsAt(null)
  }, [])

  useEffect(() => {
    if (connection !== 'active') return
    const heartbeatTimer = window.setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        setHeartbeat('checking')
        wsRef.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, 10000)
    return () => window.clearInterval(heartbeatTimer)
  }, [connection])

  useEffect(() => {
    return () => cleanupSocket()
  }, [cleanupSocket])

  const handleFormField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const startInterview = useCallback(() => {
    resetInterviewState()
    cleanupSocket()
    setConnection('connecting')
    setBusyState('connecting')
    setHeartbeat('checking')

    // Attach JWT token as query param for backend WebSocket auth
    const token = localStorage.getItem('interview_jwt')
    const wsUrlWithAuth = token
      ? `${socketUrl.trim()}?token=${encodeURIComponent(token)}`
      : socketUrl.trim()
    const ws = new WebSocket(wsUrlWithAuth)
    wsRef.current = ws

    ws.onopen = () => {
      logEvent('Socket connected. Sending start payload.')
      setHeartbeat('live')
      setLastServerTime(new Date().toLocaleTimeString())
    }

    ws.onmessage = (event) => {
      setLastServerTime(new Date().toLocaleTimeString())
      let data
      try { data = JSON.parse(event.data) } catch {
        setError('Received non-JSON response from server.')
        return
      }

      if (data.type === 'ready') {
        setBusyState('generating')
        const startPayload = { type: 'start', payload: { ...form, n: Number(form.n), enable_human_review: false } }
        // Also include token in payload as fallback
        if (token) startPayload.token = token
        ws.send(JSON.stringify(startPayload))
        return
      }
      if (data.type === 'started') {
        setConnection('active')
        setBusyState('waiting-question')
        setHeartbeat('live')
        setSessionId(data.session_id || '')
        setTotalQuestions(Number(data.total_questions || form.n))
        if (data.ends_at) {
          setEndsAt(new Date(data.ends_at))
        }
        logEvent(`Interview started. Questions: ${data.total_questions || form.n}`)
        return
      }
      if (data.type === 'question') {
        setBusyState('answering')
        setHeartbeat('live')
        setCurrentQuestion(data.question)
        setQuestionIndex(Number(data.index || 1))
        setTotalQuestions(Number(data.total_questions || form.n))
        setAnswer('')
        logEvent(`Question ${data.index || 1} received.`)
        return
      }
      if (data.type === 'result') {
        setResult(data.evaluation || {})
        setCurrentQuestion(null)
        setConnection('completed')
        setBusyState('completed')
        setHeartbeat('offline')
        logEvent('Evaluation completed.')
        cleanupSocket()
        return
      }
      if (data.type === 'pong') {
        setHeartbeat('live')
        return
      }
      if (data.type === 'error') {
        setError(data.message || 'Unknown server error')
        setConnection('error')
        setBusyState('error')
        setHeartbeat('offline')
        logEvent(`Server error: ${data.message || 'Unknown error'}`)
        return
      }
    }

    ws.onerror = () => {
      setConnection('error')
      setBusyState('error')
      setHeartbeat('offline')
      setError('WebSocket connection failed. Check backend URL and server status.')
      logEvent('Socket error.')
    }

    ws.onclose = () => {
      setConnection((prev) => (prev === 'completed' ? 'completed' : 'disconnected'))
      setBusyState((prev) => (prev === 'completed' ? 'completed' : 'idle'))
      setHeartbeat('offline')
      logEvent('Socket closed.')
    }
  }, [form, socketUrl, resetInterviewState, cleanupSocket, logEvent])

  const sendAnswer = useCallback((answerText) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !currentQuestion) return
    const questionId = String(currentQuestion.id ?? questionIndex)
    wsRef.current.send(JSON.stringify({ type: 'answer', question_id: questionId, answer: answerText }))
    setSubmittedAnswers((prev) => [...prev, { id: questionId, question_text: currentQuestion.question_text, answer: answerText }])
    setBusyState('waiting-next')
    logEvent('Answer submitted.')
    setAnswer('')
  }, [currentQuestion, questionIndex, logEvent])

  const submitAnswer = useCallback(() => sendAnswer(answer), [sendAnswer, answer])
  const skipQuestion = useCallback(() => sendAnswer(''), [sendAnswer])

  const finishNow = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    setBusyState('finishing')
    wsRef.current.send(JSON.stringify({ type: 'finish' }))
    logEvent('Requested early evaluation.')
  }, [logEvent])

  const disconnect = useCallback(() => {
    cleanupSocket()
    setConnection('disconnected')
    setBusyState('idle')
    logEvent('Disconnected by user.')
  }, [cleanupSocket, logEvent])

  return {
    form,
    socketUrl,
    setSocketUrl,
    connection,
    sessionId,
    currentQuestion,
    questionIndex,
    totalQuestions,
    answer,
    setAnswer,
    submittedAnswers,
    result,
    error,
    timeline,
    busyState,
    heartbeat,
    lastServerTime,
    endsAt,
    canStart,
    progressPercent,
    isBusyFlow,
    canAnswer,
    activeMessage,
    handleFormField,
    startInterview,
    submitAnswer,
    skipQuestion,
    finishNow,
    disconnect,
    resetInterviewState,
  }
}
