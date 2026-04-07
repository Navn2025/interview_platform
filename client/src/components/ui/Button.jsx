import React from 'react'

const variants = {
  primary:
    'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
  gradient:
    'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 active:from-blue-700 active:to-violet-700 text-white shadow-[0_4px_14px_0_rgb(37_99_235/0.35)] hover:shadow-[0_8px_24px_0_rgb(37_99_235/0.45)] hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700',
  ghost:
    'hover:bg-gray-100 active:bg-gray-200 text-gray-600 dark:hover:bg-slate-700 dark:text-slate-300',
  danger:
    'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
  outline:
    'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20',
  'white-solid':
    'bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 font-semibold',
}

const sizes = {
  sm: 'px-3.5 py-2 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
  xl: 'px-8 py-4 text-base gap-2.5',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  fullWidth = false,
  icon,
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center rounded-2xl font-semibold',
        'transition-all duration-200 ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:transform-none',
        'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        variants[variant] || variants.primary,
        sizes[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
