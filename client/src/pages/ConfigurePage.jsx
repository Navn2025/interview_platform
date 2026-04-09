import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Brain, ArrowLeft, Play, BookOpen, Layers,
  ChevronDown, SlidersHorizontal, Info,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { BLOOM_LEVELS, SUBJECTS } from '../hooks/useInterview'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const BLOOM_MODES = ['Single', 'Mixed']

export default function ConfigurePage({ onConfigured }) {
  const navigate = useNavigate()
  const [config, setConfig] = useState({
    subject: SUBJECTS[0],
    customSubject: '',
    subjectDescription: '',
    bloomMode: 'Single',
    bloomLevel: 'L3 - Apply',
    difficulty: 'Medium',
    numQuestions: 5,
  })
  const [error, setError] = useState('')

  const set = (field, val) => setConfig((p) => ({ ...p, [field]: val }))

  const handleStart = () => {
    let finalSubject = config.subject;
    if (config.subject === 'Other / Custom Subject') {
      finalSubject = config.customSubject.trim();
      if (!finalSubject) {
        setError('Please enter a custom subject.');
        return;
      }
    }
    setError('');

    const startConfig = {
      ...config,
      subject: finalSubject,
      subject_description: config.subjectDescription?.trim() || null
    };

    if (onConfigured) onConfigured(startConfig)
    navigate('/interview', { state: { config: startConfig } })
  }

  const difficultyColor = { Easy: 'text-green-600', Medium: 'text-amber-600', Hard: 'text-red-600' }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Top nav */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <button
            id="configure-back"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <div className="h-4 w-px bg-gray-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
              <Brain className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white text-sm">Configure Interview</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Configure Your Interview
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-2">
            Customize your interview parameters for a personalized experience
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left — form */}
          <div className="lg:col-span-3 space-y-6">

            {/* Subject */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Subject</h2>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <select
                    id="config-subject"
                    value={config.subject}
                    onChange={(e) => {
                      set('subject', e.target.value);
                      setError('');
                    }}
                    className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700
                               bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {config.subject === 'Other / Custom Subject' && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                      Custom Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="custom_subject"
                      value={config.customSubject}
                      onChange={(e) => {
                        set('customSubject', e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="e.g. Kotlin Coroutines"
                      className={`w-full px-4 py-3 rounded-xl border ${
                        error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-slate-700'
                      } bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                    />
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                    Subject Description (optional)
                  </label>
                  <textarea
                    value={config.subjectDescription}
                    onChange={(e) => set('subjectDescription', e.target.value)}
                    placeholder="Provide additional context to help AI generate better questions..."
                    className="w-full min-h-[80px] px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700
                               bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y"
                  />
                </div>
              </div>
            </Card>

            {/* Bloom Mode */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Bloom's Taxonomy</h2>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Choose how cognitive levels are applied</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                    Mode
                  </label>
                  <div className="flex gap-2" id="bloom-mode-toggle">
                    {BLOOM_MODES.map((mode) => (
                      <button
                        key={mode}
                        id={`bloom-mode-${mode.toLowerCase()}`}
                        onClick={() => set('bloomMode', mode)}
                        className={[
                          'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                          config.bloomMode === mode
                            ? 'bg-violet-600 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600',
                        ].join(' ')}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {config.bloomMode === 'Single' && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                      Level
                    </label>
                    <div className="relative">
                      <select
                        id="config-bloom-level"
                        value={config.bloomLevel}
                        onChange={(e) => set('bloomLevel', e.target.value)}
                        className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700
                                   bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm
                                   focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                      >
                        {BLOOM_LEVELS.filter(l => l !== 'Mixed').map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Difficulty */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Difficulty Level</h2>
              </div>
              <div className="flex gap-3" id="difficulty-toggle">
                {DIFFICULTIES.map((d) => {
                  const colors = {
                    Easy: config.difficulty === d ? 'bg-green-600 text-white' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100',
                    Medium: config.difficulty === d ? 'bg-amber-500 text-white' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100',
                    Hard: config.difficulty === d ? 'bg-red-600 text-white' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100',
                  }
                  return (
                    <button
                      key={d}
                      id={`difficulty-${d.toLowerCase()}`}
                      onClick={() => set('difficulty', d)}
                      className={[
                        'flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                        colors[d],
                      ].join(' ')}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* Number of questions */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Number of Questions</h2>
                </div>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {config.numQuestions}
                </span>
              </div>
              <input
                id="config-num-questions"
                type="range"
                min={1}
                max={20}
                value={config.numQuestions}
                onChange={(e) => set('numQuestions', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5
                           [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-md
                           [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
                           [&::-webkit-slider-thumb]:hover:scale-110"
                style={{
                  background: `linear-gradient(to right, #2563eb ${((config.numQuestions - 1) / 19) * 100}%, #e2e8f0 ${((config.numQuestions - 1) / 19) * 100}%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500 mt-2">
                <span>1 (Quick)</span>
                <span>10 (Standard)</span>
                <span>20 (Intensive)</span>
              </div>
            </Card>
          </div>

          {/* Right — Summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4">
              <Card className="border-2 border-blue-100 dark:border-blue-900/50">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Interview Summary</h3>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Subject', value: (() => {
                        const s = config.subject === 'Other / Custom Subject' ? (config.customSubject || 'Custom Subject') : config.subject;
                        return s.length > 35 ? s.substring(0, 35) + '...' : s;
                      })() },
                    { label: 'Bloom Mode', value: config.bloomMode },
                    { label: 'Bloom Level', value: config.bloomMode === 'Mixed' ? 'All Levels' : config.bloomLevel },
                    { label: 'Difficulty', value: config.difficulty, valueClass: difficultyColor[config.difficulty] + ' font-semibold' },
                    { label: 'Questions', value: `${config.numQuestions} questions` },
                  ].map(({ label, value, valueClass }) => (
                    <div key={label} className="flex items-start justify-between gap-2 py-2 border-b border-gray-50 dark:border-slate-700/50 last:border-0">
                      <span className="text-sm text-gray-500 dark:text-slate-400">{label}</span>
                      <span className={`text-sm font-medium text-gray-900 dark:text-white text-right ${valueClass || ''}`}>{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300">
                  <strong>Estimated time:</strong> ~{config.numQuestions * 3}–{config.numQuestions * 5} minutes
                </div>
              </Card>

              <Button
                id="start-interview-config"
                onClick={handleStart}
                fullWidth
                size="lg"
                icon={<Play className="w-5 h-5" />}
              >
                Start Interview
              </Button>

              <p className="text-xs text-center text-gray-400 dark:text-slate-500">
                You can skip individual questions during the interview
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
