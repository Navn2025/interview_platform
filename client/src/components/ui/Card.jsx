import React from 'react'

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'p-6',
  ...props
}) {
  return (
    <div
      className={[
        'bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60',
        'shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_1px_2px_-1px_rgb(0_0_0/0.04)]',
        hover
          ? 'transition-all duration-300 ease-out hover:shadow-[0_20px_40px_-12px_rgb(0_0_0/0.1)] hover:-translate-y-1 hover:border-blue-200/50 dark:hover:border-blue-400/20 cursor-pointer'
          : 'transition-colors duration-200',
        padding,
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
