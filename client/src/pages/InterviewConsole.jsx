import {useEffect, useMemo, useRef, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Timer from '../components/Timer'
import '../App.css'

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const DEFAULT_WS_URL = baseUrl.replace(/^http/, 'ws') + '/interview/ws';

const BLOOM_LEVELS=[
  'L1 - Remember',
  'L2 - Understand',
  'L3 - Apply',
  'L4 - Analyze',
  'L5 - Evaluate',
  'L6 - Create',
  'L7 - Innovate',
  'Mixed',
]

const STAGE_COPY={
  idle: 'Ready to start your interview.',
  connecting: 'Connecting to the interview service.',
  generating: 'Generating your interview questions.',
  'waiting-question': 'Loading your first question.',
  answering: 'Question is ready. Submit when you are done.',
  'waiting-next': 'Processing your answer and preparing the next question.',
  finishing: 'Finalizing your evaluation report.',
  completed: 'Interview completed. Review your results.',
  error: 'Connection issue detected. Please retry.',
}

function InterviewConsole()
{
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [form, setForm]=useState({
    subject: 'Data Structures and Algorithms (DSA)',
    subject_description:
      'Data structures and algorithms for solving real-world engineering problems.',
    query: '',
    difficulty: 'medium',
    bloom_level: 'L3 - Apply',
    n: 5,
    real_world_required: true,
  })

  const [socketUrl, setSocketUrl]=useState(DEFAULT_WS_URL)
  const [connection, setConnection]=useState('disconnected')
  const [sessionId, setSessionId]=useState('')
  const interviewIdRef = useRef(null)
  const resumeRef = useRef(null)
  const [currentQuestion, setCurrentQuestion]=useState(null)
  const [questionIndex, setQuestionIndex]=useState(0)
  const [totalQuestions, setTotalQuestions]=useState(0)
  const [answer, setAnswer]=useState('')
  const [submittedAnswers, setSubmittedAnswers]=useState([])
  const [result, setResult]=useState(null)
  const [error, setError]=useState('')
  const [timeline, setTimeline]=useState([])
  const [busyState, setBusyState]=useState('idle')
  const [heartbeat, setHeartbeat]=useState('offline')
  const [lastServerTime, setLastServerTime]=useState('')
  const [startTime, setStartTime]=useState(null)
  const [durationMinutes, setDurationMinutes]=useState(15)

  const wsRef=useRef(null)

  const canStart=useMemo(() =>
  {
    return form.subject.trim().length>1&&connection!=='connecting'&&connection!=='active'
  }, [form.subject, connection])

  const progressPercent=useMemo(() =>
  {
    if (!totalQuestions)
    {
      return 0
    }
    return Math.min(100, Math.round((questionIndex/totalQuestions)*100))
  }, [questionIndex, totalQuestions])

  const scorePercent=Number(result?.overall_score??0)

  const isBusyFlow=[
    'connecting',
    'generating',
    'waiting-question',
    'waiting-next',
    'finishing',
  ].includes(busyState)

  const canAnswer=!!currentQuestion&&busyState==='answering'&&connection==='active'

  const activeMessage=useMemo(() => STAGE_COPY[busyState]||STAGE_COPY.idle, [busyState])

  const heartbeatText=useMemo(() =>
  {
    if (heartbeat==='live')
    {
      return lastServerTime? `Live - ${lastServerTime}`:'Live'
    }
    if (heartbeat==='checking')
    {
      return 'Syncing heartbeat'
    }
    return 'Offline'
  }, [heartbeat, lastServerTime])

  const logEvent=(message) =>
  {
    setTimeline((prev) =>
    {
      const stamp=new Date().toLocaleTimeString()
      return [`${stamp} - ${message}`, ...prev].slice(0, 12)
    })
  }

  const cleanupSocket=() =>
  {
    if (wsRef.current)
    {
      wsRef.current.onopen=null
      wsRef.current.onmessage=null
      wsRef.current.onerror=null
      wsRef.current.onclose=null
      wsRef.current.close()
      wsRef.current=null
    }
    setHeartbeat('offline')
  }

  const resetInterviewState=() =>
  {
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
    setStartTime(null)
  }

  useEffect(() =>
  {
    if (connection!=='active')
    {
      return
    }

    const heartbeatTimer=window.setInterval(() =>
    {
      if (wsRef.current&&wsRef.current.readyState===WebSocket.OPEN)
      {
        setHeartbeat('checking')
        wsRef.current.send(JSON.stringify({type: 'ping'}))
      }
    }, 10000)

    return () => window.clearInterval(heartbeatTimer)
  }, [connection])

  useEffect(() =>
  {
    return () => cleanupSocket()
  }, [])

  const handleField=(field, value) =>
  {
    setForm((prev) => ({...prev, [field]: value}))
  }

  const startInterview=(isResume = false) =>
  {
    if (!isResume) {
      resetInterviewState()
      interviewIdRef.current = null
    }
    cleanupSocket()
    setConnection('connecting')
    setBusyState('connecting')
    setHeartbeat('checking')

    // Connect without exposing token in URL query params
    const ws=new WebSocket(socketUrl.trim())
    wsRef.current=ws

    ws.onopen=() =>
    {
      logEvent('Socket connected.')
      setHeartbeat('live')
      setLastServerTime(new Date().toLocaleTimeString())
    }

    ws.onmessage=(event) =>
    {
      setLastServerTime(new Date().toLocaleTimeString())

      let data
      try
      {
        data=JSON.parse(event.data)
      } catch
      {
        setError('Received non-JSON response from server.')
        logEvent('Malformed server event.')
        return
      }

      if (data.type==='ready')
      {
        setBusyState('generating')
        if (isResume && interviewIdRef.current) {
          logEvent('Sending resume payload.')
          ws.send(JSON.stringify({ type: 'resume', token: token, interview_id: interviewIdRef.current }))
        } else {
          ws.send(
            JSON.stringify({
              type: 'start',
              token: token,
              payload: {
                ...form,
                n: Number(form.n),
                enable_human_review: false,
              },
            }),
          )
        }
        return
      }

      if (data.type==='started')
      {
        setConnection('active')
        setBusyState('waiting-question')
        setHeartbeat('live')
        setSessionId(data.session_id||'')
        interviewIdRef.current = data.interview_id || interviewIdRef.current
        setTotalQuestions(Number(data.total_questions||form.n))
        setStartTime(data.start_time || new Date().toISOString())
        setDurationMinutes(data.duration_minutes || 15)
        logEvent(`Interview started. Questions: ${data.total_questions||form.n}`)
        return
      }

      if (data.type==='question')
      {
        setBusyState('answering')
        setHeartbeat('live')
        setCurrentQuestion(data.question)
        setQuestionIndex(Number(data.index||1))
        setTotalQuestions(Number(data.total_questions||form.n))
        setAnswer('')
        logEvent(`Question ${data.index||1} received.`)
        return
      }

      if (data.type==='result')
      {
        setResult(data.evaluation||{})
        setCurrentQuestion(null)
        setConnection('completed')
        setBusyState('completed')
        setHeartbeat('offline')
        logEvent('Evaluation completed.')
        cleanupSocket()
        return
      }

      if (data.type==='pong')
      {
        setHeartbeat('live')
        return
      }

      if (data.type==='interview_ended')
      {
        setError('Interview time is up.')
        finishNow()
        return
      }

      if (data.type==='error')
      {
        setError(data.message||'Unknown server error')
        setConnection('error')
        setBusyState('error')
        setHeartbeat('offline')
        logEvent(`Server error: ${data.message||'Unknown error'}`)
        return
      }

      logEvent('Received unsupported message from server.')
    }

    ws.onerror=() =>
    {
      setConnection('error')
      setBusyState('error')
      setHeartbeat('offline')
      setError('WebSocket connection failed. Check backend URL and server status.')
      logEvent('Socket error.')
    }

    ws.onclose=(e) =>
    {
      if (e.code !== 1000 && e.code !== 1008 && interviewIdRef.current) {
        logEvent('Connection lost abruptly. Reconnecting in 3s...')
        setTimeout(() => {
           if (resumeRef.current) resumeRef.current()
        }, 3000)
      } else {
        setConnection((prev) => (prev==='completed'? 'completed':'disconnected'))
        setBusyState((prev) => (prev==='completed'? 'completed':'idle'))
        setHeartbeat('offline')
        logEvent('Socket closed.')
      }
    }
  }

  resumeRef.current = () => startInterview(true)

  const sendAnswer=(answerText) =>
  {
    if (!wsRef.current||wsRef.current.readyState!==WebSocket.OPEN||!currentQuestion)
    {
      return
    }

    const questionId=String(currentQuestion.id??questionIndex)
    wsRef.current.send(
      JSON.stringify({
        type: 'answer',
        question_id: questionId,
        answer: answerText,
      }),
    )

    setSubmittedAnswers((prev) => [
      ...prev,
      {
        id: questionId,
        question_text: currentQuestion.question_text,
        answer: answerText,
      },
    ])

    setBusyState('waiting-next')
    logEvent('Answer submitted. Preparing next interaction.')
    setAnswer('')
  }

  const submitAnswer=() =>
  {
    sendAnswer(answer)
  }

  const skipQuestion=() =>
  {
    sendAnswer('')
  }

  const finishNow=() =>
  {
    if (!wsRef.current||wsRef.current.readyState!==WebSocket.OPEN)
    {
      return
    }
    setBusyState('finishing')
    wsRef.current.send(JSON.stringify({type: 'finish'}))
    logEvent('Requested early evaluation.')
  }

  const disconnect=() =>
  {
    cleanupSocket()
    interviewIdRef.current = null
    setConnection('disconnected')
    setBusyState('idle')
    logEvent('Disconnected by user.')
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one"></div>
      <div className="ambient ambient-two"></div>

      <header className="topbar">
        <div className="title-wrap">
          <p className="kicker">Saarthi Interview Studio</p>
          <h1>Real-time Technical Interview Console</h1>
          <p className="subtitle">
            Adaptive interviews over WebSocket with instant scoring and structured feedback.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {connection !== 'disconnected' && (
            <div className={`status status-${connection}`}>
              {connection}
            </div>
          )}
          <button className="btn" onClick={() => navigate('/profile')} style={{ padding: '8px 12px', fontSize: '0.75rem' }}>
            Profile
          </button>
          <button className="btn" onClick={logout} style={{ padding: '8px 12px', fontSize: '0.75rem' }}>
            Logout
          </button>
        </div>
      </header>

      <section className="live-strip" aria-live="polite">
        <div className={`heartbeat-dot heartbeat-${heartbeat}`}></div>
        <p>{activeMessage}</p>
        <span>{heartbeatText}</span>
      </section>

      <section className="metrics-strip">
        <article className="metric-card">
          <p>Session</p>
          <h3>{sessionId? `${sessionId.slice(0, 8)}...`:'pending'}</h3>
        </article>

        <article className="metric-card">
          <p>Questions</p>
          <h3>
            {questionIndex}/{totalQuestions||form.n}
          </h3>
        </article>

        <article className="metric-card metric-wide">
          <p>Progress</p>
          <div className="progress-track" aria-label="Interview progress">
            <div className="progress-fill" style={{width: `${progressPercent}%`}}></div>
          </div>
          <span>{progressPercent}%</span>
        </article>

        <article className="metric-card">
          <p>Score</p>
          <h3>{result? `${scorePercent}%`:'--'}</h3>
        </article>
      </section>

      <main className="layout">
        <section className="panel setup-panel">
          <h2>Interview Setup</h2>
          <label>
            WebSocket URL
            <input
              value={socketUrl}
              onChange={(e) => setSocketUrl(e.target.value)}
              placeholder={DEFAULT_WS_URL}
            />
          </label>

          <label>
            Subject
            <input
              value={form.subject}
              onChange={(e) => handleField('subject', e.target.value)}
            />
          </label>

          <label>
            Subject Description
            <textarea
              rows={3}
              value={form.subject_description}
              onChange={(e) => handleField('subject_description', e.target.value)}
            />
          </label>

          <label>
            Optional Query
            <input
              value={form.query}
              onChange={(e) => handleField('query', e.target.value)}
            />
          </label>

          <div className="grid-2">
            <label>
              Difficulty
              <select
                value={form.difficulty}
                onChange={(e) => handleField('difficulty', e.target.value)}
              >
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </label>

            <label>
              Questions
              <input
                type="number"
                min={1}
                max={20}
                value={form.n}
                onChange={(e) => handleField('n', e.target.value)}
              />
            </label>
          </div>

          <label>
            Bloom Level
            <select
              value={form.bloom_level}
              onChange={(e) => handleField('bloom_level', e.target.value)}
            >
              {BLOOM_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.real_world_required}
              onChange={(e) => handleField('real_world_required', e.target.checked)}
            />
            Include real-world constraints
          </label>

          <div className="actions">
            <button className="btn btn-primary" disabled={!canStart} onClick={startInterview}>
              Start Interview
            </button>
            <button className="btn" onClick={disconnect} disabled={connection==='disconnected'}>
              Disconnect
            </button>
          </div>

          {sessionId&&<p className="session">Session: {sessionId}</p>}
          {error&&<p className="error-box">{error}</p>}
        </section>

        <section className="panel interview-panel">
          <div className="panel-head">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              Live Interview
              {connection === 'active' && startTime && (
                <span className="status status-active" style={{ fontSize: '0.72rem', padding: '4px 8px' }}>
                  <Timer startTime={startTime} durationMinutes={durationMinutes} onExpire={finishNow} />
                </span>
              )}
            </h2>
            <span>
              {questionIndex}/{totalQuestions||form.n}
            </span>
          </div>

          {currentQuestion? (
            <>
              <article className="question-card">
                <h3>{currentQuestion.question_text}</h3>
                <p>
                  <strong>Expected answer time:</strong>{' '}
                  {currentQuestion.estimated_answer_time_sec||'N/A'} sec
                </p>
                {!!currentQuestion.topic_tags?.length&&(
                  <div className="topic-tags">
                    {currentQuestion.topic_tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>

              <textarea
                className="answer-input"
                rows={8}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your answer with reasoning and trade-offs..."
              />

              <div className="actions">
                <button className="btn btn-primary" onClick={submitAnswer} disabled={!canAnswer}>
                  Submit Answer
                </button>
                <button className="btn" onClick={skipQuestion} disabled={!canAnswer}>
                  Skip
                </button>
                <button className="btn" onClick={finishNow} disabled={busyState==='finishing'||connection!=='active'}>
                  Finish and Evaluate
                </button>
              </div>
            </>
          ):isBusyFlow? (
            <div className="loading-card">
              <div className="loading-row loading-strong"></div>
              <div className="loading-row"></div>
              <div className="loading-row loading-short"></div>
              <p>{activeMessage}</p>
            </div>
          ):(
            <div className="empty-state">
              <p>Start an interview to receive your first question.</p>
            </div>
          )}
        </section>

        <section className="panel result-panel">
          <h2>Evaluation Report</h2>

          {result? (
            <>
              <div className="score-box">
                <div className="score-label">Overall Score</div>
                <div className="score-value">{result.overall_score??0}%</div>
                <p>{result.overall_assessment||'No assessment generated.'}</p>
                <div className="progress-track score-track">
                  <div className="progress-fill" style={{width: `${scorePercent}%`}}></div>
                </div>
              </div>

              {!!result.strengths?.length&&(
                <div className="insight-block">
                  <h3>Strengths</h3>
                  <ul>
                    {result.strengths.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!!result.improvement_areas?.length&&(
                <div className="insight-block">
                  <h3>Improvement Areas</h3>
                  <ul>
                    {result.improvement_areas.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="evaluation-list">
                {(result.per_question||[]).map((item) => (
                  <article key={item.id} className="eval-item">
                    <header>
                      <strong>Q{item.id}</strong>
                      <span className={`verdict verdict-${item.verdict}`}>{item.verdict}</span>
                      <span>{item.score}/10</span>
                    </header>
                    <p>{item.feedback||'No feedback.'}</p>
                  </article>
                ))}
              </div>
            </>
          ):busyState==='finishing'? (
            <div className="result-placeholder">
              <div className="loading-row loading-strong"></div>
              <div className="loading-row"></div>
              <div className="loading-row loading-short"></div>
              <p>Finalizing your evaluation report.</p>
            </div>
          ):(
            <p className="muted">Evaluation will appear after you finish the interview.</p>
          )}
        </section>

        <section className="panel timeline-panel">
          <h2>Session Timeline</h2>
          <div className="timeline-grid">
            <div>
              {timeline.length? (
                <ul>
                  {timeline.map((entry, idx) => (
                    <li key={`${entry}-${idx}`}>{entry}</li>
                  ))}
                </ul>
              ):(
                <p className="muted">No events yet.</p>
              )}
            </div>

            {!!submittedAnswers.length&&(
              <div>
                <h3>Submitted Answers</h3>
                <ul>
                  {submittedAnswers.map((item) => (
                    <li key={`${item.id}-${item.question_text}`}>
                      <strong>Q{item.id}:</strong> {item.answer||'(blank)'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default InterviewConsole
