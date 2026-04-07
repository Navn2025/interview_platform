import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Moon, Sun, LogOut } from 'lucide-react'
import LogoMark from '../ui/Logo'

export default function DashboardNavbar({ userName, darkMode, onToggleDark, activeTab, onTabChange }) {
  const navigate = useNavigate()
  const tabs = ['Overview', 'My Interviews', 'Analytics', 'Profile']

  const handleLogout = () => {
    navigate('/')
  }

  return (
    <header className="navbar-blur border-b border-gray-100/80 dark:border-slate-800/80 sticky top-0 z-40 shadow-[0_1px_3px_0_rgb(0_0_0/0.03)]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Top row */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <LogoMark size={32} />
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none">
                Student Dashboard
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Welcome back, <span className="font-medium text-blue-600 dark:text-blue-400">{userName || 'Student'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark mode toggle — pill style */}
            <button
              id="dark-mode-toggle"
              onClick={onToggleDark}
              className="relative flex items-center w-[72px] h-9 rounded-full p-1
                         bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700
                         transition-colors duration-300 hover:border-blue-300 dark:hover:border-blue-600"
              aria-label="Toggle dark mode"
            >
              {/* Sliding indicator */}
              <div
                className={[
                  'absolute w-7 h-7 rounded-full shadow-md transition-all duration-300 ease-out',
                  darkMode
                    ? 'translate-x-[36px] bg-slate-700'
                    : 'translate-x-0 bg-white',
                ].join(' ')}
              />
              {/* Sun icon */}
              <Sun className={`relative z-10 w-4 h-4 ml-1.5 transition-colors duration-200 ${darkMode ? 'text-slate-500' : 'text-amber-500'}`} />
              {/* Moon icon */}
              <Moon className={`relative z-10 w-4 h-4 ml-auto mr-1.5 transition-colors duration-200 ${darkMode ? 'text-blue-400' : 'text-gray-400'}`} />
            </button>

            <button
              id="logout-btn"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-slate-400
                         hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400
                         transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Tab row — pill style */}
        <nav className="flex gap-1 pb-3 overflow-x-auto scrollbar-none -mx-1 px-1" id="dashboard-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              id={`tab-${tab.toLowerCase().replace(' ', '-')}`}
              onClick={() => onTabChange(tab)}
              className={[
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-250 whitespace-nowrap',
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-[0_2px_8px_0_rgb(37_99_235/0.3)]'
                  : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-slate-200',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
