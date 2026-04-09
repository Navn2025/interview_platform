import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import {
  Video, TrendingUp, Award, Target, Play, Plus,
  BarChart2, User, Mail, Camera, Sparkles,
} from 'lucide-react'
import DashboardNavbar from '../components/layout/DashboardNavbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

/* ────────────────── Stat Card ────────────────── */
function StatCard({ icon, value, label, iconBg }) {
  return (
    <Card hover className="flex flex-col gap-4">
      <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
        {icon}
      </div>
      <div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {value}
        </div>
        <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">{label}</div>
      </div>
    </Card>
  )
}

/* ────────────────── Overview Tab ────────────────── */
function OverviewTab({ navigate, interviews }) {
  const completed = interviews.filter(i => i.status === 'completed')
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, i) => s + (i.overall_score || 0), 0) / completed.length)
    : 0
  const uniqueSubjects = new Set(interviews.map(i => i.subject)).size

  const stats = [
    { icon: <Video className="w-5 h-5 text-blue-600" />, value: String(completed.length), label: 'Interviews Completed', iconBg: 'bg-blue-50 dark:bg-blue-900/30' },
    { icon: <TrendingUp className="w-5 h-5 text-green-600" />, value: `${avgScore}%`, label: 'Average Score', iconBg: 'bg-green-50 dark:bg-green-900/30' },
    { icon: <Award className="w-5 h-5 text-violet-600" />, value: String(uniqueSubjects), label: 'Subjects Covered', iconBg: 'bg-violet-50 dark:bg-violet-900/30' },
    { icon: <Target className="w-5 h-5 text-orange-600" />, value: String(interviews.length), label: 'Total Interviews', iconBg: 'bg-orange-50 dark:bg-orange-900/30' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* CTA Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-violet-700 p-10 text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-0 w-72 h-72 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 60%)', transform: 'translate(-30%, -30%)' }}
          />
          <div
            className="absolute bottom-0 right-0 w-56 h-56 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.5) 0%, transparent 60%)', transform: 'translate(20%, 20%)' }}
          />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-white/90 text-xs font-medium">AI-Powered Practice</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Start New Interview
          </h2>
          <p className="text-blue-100/80 text-sm mb-7 max-w-md mx-auto">
            Practice with AI-powered mock interviews and get instant feedback on your performance
          </p>

          <Button
            id="start-interview-overview"
            onClick={() => navigate('/configure')}
            variant="white-solid"
            size="lg"
            icon={<Play className="w-4 h-4" />}
          >
            Start Interview
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ────────────────── My Interviews Tab ────────────────── */
function MyInterviewsTab({ navigate, interviews }) {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Interview History
        </h2>
        <Button
          id="new-interview-btn"
          onClick={() => navigate('/configure')}
          size="sm"
          variant="gradient"
          icon={<Plus className="w-4 h-4" />}
        >
          New Interview
        </Button>
      </div>
      {interviews.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
              <Video className="w-9 h-9 text-gray-400 dark:text-slate-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1.5">No interviews yet</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Start your first mock interview to get personalized AI feedback and track your progress
              </p>
            </div>
            <Button
              id="start-first-interview-btn"
              onClick={() => navigate('/configure')}
              variant="gradient"
              icon={<Plus className="w-4 h-4" />}
            >
              Start First Interview
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {interviews.map((iv) => (
            <Card key={iv.id} hover className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow">
                  {(iv.subject || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{iv.subject}</h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {new Date(iv.created_at).toLocaleDateString()} · {iv.total_questions} questions · {iv.difficulty || 'medium'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  iv.status === 'completed'
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : iv.status === 'expired'
                    ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                }`}>
                  {iv.status === 'completed'
                    ? `${iv.overall_score != null ? Math.round(iv.overall_score) + '%' : 'Done'}`
                    : iv.status}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/* ────────────────── Analytics Tab ────────────────── */
function AnalyticsTab() {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Performance Analytics
      </h2>
      <Card>
        <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
            <BarChart2 className="w-9 h-9 text-gray-400 dark:text-slate-500" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1.5">No data available</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Complete interviews to see your detailed performance analytics and improvement trends
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

/* ────────────────── Profile Tab ────────────────── */
function ProfileTab({ user }) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Profile
      </h2>
      <Card className="max-w-lg">
        <div className="flex items-center gap-5 mb-8 pb-8 border-b border-gray-100 dark:border-slate-700/50">
          <div className="relative">
            <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ width: 72, height: 72 }}>
              {(user?.name || 'U')[0].toUpperCase()}
            </div>
            <button className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm">
              <Camera className="w-3.5 h-3.5 text-gray-600 dark:text-slate-300" />
            </button>
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{user?.name || 'User_Name'}</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Student</p>
          </div>
        </div>

        <h4 className="font-semibold text-gray-800 dark:text-white mb-5">Personal Information</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/50">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
              <User className="w-4 h-4 text-gray-500 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 font-medium uppercase tracking-wider">Name</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{user?.name || 'User_Name'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/50">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
              <Mail className="w-4 h-4 text-gray-500 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 font-medium uppercase tracking-wider">Email</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{user?.email || 'User@mail.com'}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

/* ────────────────── Dashboard Page ────────────────── */
export default function DashboardPage({ user, darkMode, onToggleDark, onLogout }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Overview')
  const [interviews, setInterviews] = useState([])

  useEffect(() => {
    api.getHistory().then(setInterviews)
  }, [])

  const renderTab = () => {
    switch (activeTab) {
      case 'Overview': return <OverviewTab navigate={navigate} interviews={interviews} />
      case 'My Interviews': return <MyInterviewsTab navigate={navigate} interviews={interviews} />
      case 'Analytics': return <AnalyticsTab />
      case 'Profile': return <ProfileTab user={user} />
      default: return <OverviewTab navigate={navigate} interviews={interviews} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950">
      <DashboardNavbar
        userName={user?.name || user?.email}
        darkMode={darkMode}
        onToggleDark={onToggleDark}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
      />
      <main className="max-w-7xl mx-auto px-6 py-10">
        {renderTab()}
      </main>
    </div>
  )
}
