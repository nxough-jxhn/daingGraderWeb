import React from 'react'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string | null
}

export default function Input({label, error, className='', ...rest}: Props){
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label className="text-sm text-gray-700 mb-1">{label}</label>}
      <input className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40`} {...rest} />
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  )
}
