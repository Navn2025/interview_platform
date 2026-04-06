import React from 'react'

/** Prashikshan AI brand mark — gradient square with stylised "P" + neural AI dot */
export function LogoMark({ size = 36, className = '' }) {
  return (
    <div
      className={`bg-gradient-to-br from-blue-600 to-violet-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={Math.round(size * 0.68)}
        height={Math.round(size * 0.68)}
        viewBox="0 0 26 26"
        fill="none"
      >
        {/* Stylised "P" */}
        <path
          d="M4 4h9a5 5 0 0 1 0 10H7M4 4v18"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* AI neural dot cluster */}
        <circle cx="21" cy="18" r="2.2" fill="#FCD34D" />
        <circle cx="18.5" cy="22.5" r="1.3" fill="rgba(255,255,255,0.55)" />
        <circle cx="23.5" cy="22.5" r="1.3" fill="rgba(255,255,255,0.55)" />
        <line x1="21" y1="18" x2="18.5" y2="22.5" stroke="rgba(255,255,255,0.4)" strokeWidth="0.9" />
        <line x1="21" y1="18" x2="23.5" y2="22.5" stroke="rgba(255,255,255,0.4)" strokeWidth="0.9" />
      </svg>
    </div>
  )
}

/** Full horizontal logo: mark + wordmark */
export function LogoFull({ white = false, size = 'md', className = '' }) {
  const markSize = { sm: 28, md: 34, lg: 44 }[size] ?? 34
  const textSize = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }[size] ?? 'text-base'
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={markSize} />
      <span
        className={`font-bold ${textSize} leading-none ${white ? 'text-white' : 'text-gray-900 dark:text-white'}`}
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        Prashikshan{' '}
        <span className={white ? 'text-amber-300' : 'text-blue-600 dark:text-blue-400'}>AI</span>
      </span>
    </div>
  )
}

export default LogoMark
