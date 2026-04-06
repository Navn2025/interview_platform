import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import ConfigurePage from './pages/ConfigurePage'
import InterviewPage from './pages/InterviewPage'

function App() {
  const [user, setUser] = useState(null)
  const [darkMode, setDarkMode] = useState(() => {
    // Default to light mode; only use stored value if user has explicitly set it
    const stored = localStorage.getItem('prashikshan-dark')
    if (stored === null) {
      localStorage.setItem('prashikshan-dark', 'false')
      return false
    }
    return stored === 'true'
  })

  // Apply dark mode class to <html>
  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('prashikshan-dark', String(darkMode))
  }, [darkMode])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    setUser(null)
  }

  const toggleDark = () => setDarkMode((p) => !p)

  const sharedProps = { user, darkMode, onToggleDark: toggleDark, onLogout: handleLogout }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/signup" element={<SignupPage onLogin={handleLogin} />} />
        <Route
          path="/dashboard"
          element={<DashboardPage {...sharedProps} />}
        />
        <Route
          path="/configure"
          element={<ConfigurePage />}
        />
        <Route
          path="/interview"
          element={<InterviewPage />}
        />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
