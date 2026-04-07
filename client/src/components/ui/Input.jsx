import React from 'react'

export default function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  className = '',
  required,
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-gray-700 dark:text-slate-300"
        >
          {label}
          {required && <span className="text-blue-600 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={[
          'w-full px-4 py-3 rounded-xl border text-sm',
          'bg-gray-50 dark:bg-slate-900',
          'text-gray-900 dark:text-slate-100',
          'placeholder:text-gray-400 dark:placeholder:text-slate-500',
          error
            ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
            : 'border-gray-200 dark:border-slate-700 focus:ring-blue-500 focus:border-blue-500',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          'transition-colors duration-150',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
