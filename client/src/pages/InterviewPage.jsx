import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  X, Mic, MicOff, SkipForward, Send, Clock, Brain,
  Lightbulb, CheckCircle, Circle, Loader2, Volume2,
  ChevronRight, AlertCircle,
} from 'lucide-react'
import useInterview, { STAGE_COPY } from '../hooks/useInterview'
import { LogoMark, LogoFull } from '../components/ui/Logo'

function TypewriterText({ text, speed = 20 }) {
  const pRef = useRef(null)

  useEffect(() => {
    if (!pRef.current || !text) return
    const el = pRef.current
    let i = 0
    el.textContent = ""

    const interval = setInterval(() => {
      el.textContent = text.slice(0, i + 1)
      i++
      if (i >= text.length) clearInterval(interval)
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed])

  return (
    <p className="text-gray-900 dark:text-white text-sm leading-relaxed font-medium">
      <span ref={pRef}></span>
      <span className="ml-1 animate-pulse" aria-hidden="true">|</span>
    </p>
  )
}
/* ─── AI State Badge ─── */
function AIStateBadge({ busyState }) {
  const states = {
    answering: { label: '● Listening...', color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' },
    'waiting-next': { label: '⟳ Processing...', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
    generating: { label: '✦ AI Speaking...', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
    'waiting-question': { label: '⟳ Loading...', color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800' },
    connecting: { label: '⟳ Connecting...', color: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
    finishing: { label: '⟳ Finalizing...', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
    completed: { label: '✓ Completed', color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' },
    error: { label: '✕ Error', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
  }
  const s = states[busyState]
  if (!s) return null
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${s.color}`} role="status" aria-label={`AI Status: ${s.label}`}>
      {s.label}
    </span>
  )
}

/* ─── Timer ─── */
function Timer({ running, endsAt }) {
  const [displayTime, setDisplayTime] = useState({ m: 0, s: 0 })

  useEffect(() => {
    if (!running) return

    const interval = setInterval(() => {
      if (endsAt) {
        const remaining = Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000))
        setDisplayTime({ m: Math.floor(remaining / 60), s: remaining % 60 })
      } else {
        // Fallback count up if no endsAt
        setDisplayTime((prev) => {
          const total = prev.m * 60 + prev.s + 1
          return { m: Math.floor(total / 60), s: total % 60 }
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [running, endsAt])

  const mm = String(displayTime.m).padStart(2, '0')
  const ss = String(displayTime.s).padStart(2, '0')

  const timeColor = endsAt && displayTime.m < 2 ? 'text-red-500' : 'text-gray-700 dark:text-slate-300'
  const iconColor = endsAt && displayTime.m < 2 ? 'text-red-500 animate-pulse' : 'text-blue-500'

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 ${timeColor} text-sm font-mono border border-gray-200 dark:border-slate-700`} aria-label="Interview Timer" role="timer" aria-live="polite">
      <Clock className={`w-3.5 h-3.5 ${iconColor}`} aria-hidden="true" />
      {mm}:{ss}
    </div>
  )
}

/* ─── Tips Card ─── */
const TIPS = [
  'Start with a clear structure: intro → key points → conclusion.',
  'Use speaking for explanation, writing for structured answers.',
  'Speak clearly and think aloud to show your reasoning.',
  'Keep written answers concise with bullet points.',
  'Support answers with real examples.',
  'End with a short, strong conclusion.',
];

function TipsCard() {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-4">

      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-500">
          Interview Tips
        </h3>
      </div>

      <ul className="space-y-2">
        {TIPS.map((tip, i) => (
          <li
            key={i}
            className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed flex gap-2"
          >
            <span className="text-amber-500">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>

    </div>
  )
}

/* ─── Question Progress List ─── */
function QuestionProgressList({ questionIndex, totalQuestions, askedQuestions }) {
  const count = Math.max(totalQuestions || 5, askedQuestions.length)
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 flex-1 overflow-y-auto shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Question Progress</h3>
      <div className="space-y-1.5">
        {Array.from({ length: count }, (_, i) => {
          const done = i < questionIndex - 1
          const current = i === questionIndex - 1
          const qText = askedQuestions[i]?.topic_tags?.[0] || askedQuestions[i]?.question_text?.substring(0, 20) || 'Question'
          return (
            <div
              key={i}
              className={[
                'flex items-center gap-2.5 p-2 rounded-xl transition-colors text-xs font-medium',
                current ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40' : '',
              ].join(' ')}
            >
              {done ? (
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              ) : current ? (
                <div className="w-4 h-4 rounded-full border-2 border-blue-500 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                </div>
              ) : (
                <Circle className="w-4 h-4 text-gray-300 dark:text-slate-600 shrink-0" />
              )}
              <span className={done ? 'text-green-600 dark:text-green-500' : current ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}>
                Q{i + 1} — {qText}
              </span>
              {current && <ChevronRight className="w-3 h-3 text-blue-400 ml-auto shrink-0" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Result Panel ─── */
function ResultPanel({ result, navigate }) {
  if (!result) return null
  const score = Number(result.overall_score ?? 0)
  const scoreColor = score >= 70 ? 'text-green-600 dark:text-green-500' : score >= 50 ? 'text-amber-600 dark:text-amber-500' : 'text-red-600 dark:text-red-500'
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 space-y-3 animate-slide-up shadow-sm overflow-y-auto">
      <h2 className="text-base font-bold text-gray-900 dark:text-white">Interview Complete 🎉</h2>
      <div className="text-center py-2">
        <div className={`text-4xl font-bold ${scoreColor}`}>{score}%</div>
        <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">Overall Score</div>
      </div>
      {result.overall_assessment && (
        <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">{result.overall_assessment}</p>
      )}
      {result.strengths?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-green-600 dark:text-green-500 uppercase tracking-wide mb-1">Strengths</h4>
          <ul className="space-y-0.5">
            {result.strengths.map((s) => (
              <li key={s} className="text-xs text-gray-600 dark:text-slate-400 flex gap-2"><span className="text-green-500">✓</span>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {result.improvement_areas?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wide mb-1">Areas to Improve</h4>
          <ul className="space-y-0.5">
            {result.improvement_areas.map((a) => (
              <li key={a} className="text-xs text-gray-600 dark:text-slate-400 flex gap-2"><span className="text-amber-500">→</span>{a}</li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={() => navigate('/dashboard')}
        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  )
}

/* ─── Main Interview Page ─── */
export default function InterviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const config = location.state?.config || {}
  const [micActive, setMicActive] = useState(false)

  // Use real WebSocket interview hook
  const {
    startInterview, currentQuestion, questionIndex, totalQuestions,
    answer, setAnswer, submittedAnswers,
    busyState, isBusyFlow, canAnswer, activeMessage,
    progressPercent, heartbeat, connection, result, error, endsAt,
    submitAnswer, skipQuestion, finishNow, disconnect,
    form, handleFormField,
  } = useInterview()

  // Alias to match the UI's start() call
  const start = startInterview
  const askedQuestions = submittedAnswers || []

  useEffect(() => {
    if (config.subject) handleFormField('subject', config.subject)
    if (config.difficulty) handleFormField('difficulty', config.difficulty.toLowerCase())
    if (config.bloomLevel) handleFormField('bloom_level', config.bloomLevel)
    if (config.numQuestions) handleFormField('n', config.numQuestions)
    if (config.subject_description !== undefined) handleFormField('subject_description', config.subject_description)
  }, []) // eslint-disable-line

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0

  const handleExit = () => { disconnect(); navigate('/dashboard') }

  return (
    /* Outer shell: exactly the viewport, no overflow, supports dark mode */
    <div className="h-screen w-screen flex flex-col bg-gray-50 dark:bg-slate-950 overflow-hidden">

      {/* ── TOP BAR ── */}
      <header className="flex-none bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-5 py-2.5 flex items-center justify-between shadow-sm z-50">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <LogoFull />

          {/* Question progress */}
          {totalQuestions > 0 && (
            <div className="flex items-center gap-2 ml-2">
              <div className="h-4 w-px bg-gray-200 dark:bg-slate-700" />
              <span className="text-gray-500 dark:text-slate-400 text-sm">
                Question <span className="text-gray-900 dark:text-white font-semibold">{questionIndex}</span>
                {' '}of <span className="text-gray-900 dark:text-white font-semibold">{totalQuestions}</span>
              </span>
              <div className="w-24 h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                <div
                  className="h-full bg-linear-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <AIStateBadge busyState={busyState} />
          <Timer running={connection === 'active'} endsAt={endsAt} />
          <button
            id="exit-interview"
            onClick={handleExit}
            aria-label="Exit Interview"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 dark:text-slate-400
                       hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors border border-gray-200 dark:border-slate-700 ml-1"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT (fills remaining height) ── */}
      <div className="flex-1 min-h-0 grid lg:grid-cols-3 gap-4 px-5 py-4">

        {/* ── LEFT: Question + Answer ── */}
        <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">

          {/* ── Not-started state ── */}
          {connection === 'disconnected' && !result && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
              <LogoMark size={72} className="shadow-lg" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Poppins' }}>Ready to Begin?</h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm max-w-sm">Click Start to connect to your AI interviewer.</p>
              </div>

              {/* Config summary */}
              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 text-sm text-left w-full max-w-sm space-y-2 shadow-sm">
                {[
                  ['Subject', config.subject || form.subject],
                  ['Difficulty', config.difficulty || form.difficulty],
                  ['Questions', config.numQuestions || form.n],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-400 dark:text-slate-500">{k}</span>
                    <span className="text-gray-900 dark:text-white font-medium text-right max-w-[60%] capitalize">{v}</span>
                  </div>
                ))}
              </div>

              <button
                id="start-interview-session"
                onClick={start}
                aria-label="Start Interview"
                className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-linear-to-r from-blue-600 to-violet-600
                           hover:from-blue-500 hover:to-violet-500 text-white font-semibold transition-all shadow-lg"
              >
                <Mic className="w-5 h-5" aria-hidden="true" />
                Start Interview
              </button>
            </div>
          )}

          {/* ── Loading state ── */}
          {isBusyFlow && !currentQuestion && !result && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-gray-200 dark:border-slate-800 border-t-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <LogoMark size={24} />
                </div>
              </div>
              <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">{activeMessage}</p>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm flex-none">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div><strong className="font-semibold block">Connection Error</strong>{error}</div>
            </div>
          )}

          {/* ── Active question ── */}
          {currentQuestion && (
            <>
              {/* Question card */}
              <div className="flex-none bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm animate-slide-up">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 px-2.5 py-0.5 rounded-full">
                      Question {questionIndex}
                    </span>
                    {currentQuestion.topic_tags?.map((tag) => (
                      <span key={tag} className="text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                  {currentQuestion.estimated_answer_time_sec && (
                    <span className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />~{currentQuestion.estimated_answer_time_sec}s
                    </span>
                  )}
                </div>
                {/* AI Speaking Indicator */}
                {busyState === 'generating' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1">
                      <span className="w-1 h-3 bg-blue-500 animate-bounce rounded"></span>
                      <span className="w-1 h-4 bg-blue-500 animate-bounce delay-100 rounded"></span>
                      <span className="w-1 h-2 bg-blue-500 animate-bounce delay-200 rounded"></span>
                    </div>
                    <span className="text-xs text-blue-500 font-medium">AI is speaking...</span>
                  </div>
                )}

                <TypewriterText text={currentQuestion.question_text} />
              </div>

              {/* Answer area — flex-1 so it fills remaining space */}
              <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center justify-between flex-none">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Your Answer</label>
                  <span className="text-xs text-gray-400 dark:text-slate-500">{wordCount} words</span>
                </div>
                <textarea
                  id="answer-input"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Write your answer with reasoning and trade-offs..."
                  disabled={!canAnswer}
                  aria-label="Your Answer Input field"
                  className="flex-1 w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white
                             placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-colors"
                />
                <button
                  id="submit-answer"
                  onClick={submitAnswer}
                  disabled={!canAnswer || !answer.trim()}
                  className="flex-none flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700
                             disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                >
                  {busyState === 'waiting-next' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit & Next
                </button>
              </div>
            </>
          )}

          {/* ── Result ── */}
          {result && connection === 'completed' && (
            <div className="flex-1 min-h-0">
              <ResultPanel result={result} navigate={navigate} />
            </div>
          )}
        </div>

        {/* ── RIGHT: Tips + Progress ── */}
        <div className="flex flex-col gap-3 min-h-0">
          <TipsCard />
          <QuestionProgressList
            questionIndex={questionIndex}
            totalQuestions={totalQuestions || config.numQuestions || form.n}
            askedQuestions={askedQuestions}
          />
        </div>
      </div>

      {/* ── BOTTOM CONTROLS ── */}
      <footer className="flex-none bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 px-5 py-3 shadow-[0_-1px_3px_0_rgb(0_0_0/0.05)]">
        <div className="flex items-center justify-between gap-4">
          {/* Connection indicator */}
          <div className="flex items-center gap-2 min-w-[80px]">
            <div className={`w-2 h-2 rounded-full shrink-0 ${heartbeat === 'live' ? 'bg-green-500 animate-pulse'
              : heartbeat === 'checking' ? 'bg-amber-400 animate-pulse'
                : 'bg-gray-300 dark:bg-slate-600'
              }`} />
            <span className="text-xs text-gray-400 dark:text-slate-500">
              {heartbeat === 'live' ? 'Connected' : heartbeat === 'checking' ? 'Syncing...' : 'Offline'}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              id="mic-start"
              onClick={() => setMicActive(true)}
              disabled={!canAnswer || micActive}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40
                         border border-green-200 dark:border-green-800 text-green-700 dark:text-green-500 text-sm font-medium transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">Start</span>
            </button>

            <button
              id="mic-stop"
              onClick={() => setMicActive(false)}
              disabled={!micActive}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40
                         border border-red-200 dark:border-red-800 text-red-700 dark:text-red-500 text-sm font-medium transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <MicOff className="w-4 h-4" />
              <span className="hidden sm:inline">Stop</span>
            </button>

            <button
              id="skip-question"
              onClick={skipQuestion}
              disabled={!canAnswer}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700
                         border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-sm font-medium transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SkipForward className="w-4 h-4" />
              <span className="hidden sm:inline">Skip</span>
            </button>

            {connection === 'active' && (
              <button
                id="finish-now"
                onClick={finishNow}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40
                           border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400 text-sm font-medium transition-all"
              >
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline">Finish</span>
              </button>
            )}
          </div>

          {/* Recording indicator */}
          <div className="min-w-[80px] flex justify-end">
            {micActive && (
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-500 text-xs font-medium animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Recording...
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
