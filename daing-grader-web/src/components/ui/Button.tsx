import React from 'react'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline'
}

export default function Button({variant='primary', children, className='', disabled, ...rest}: Props){
  const base = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
  const styles = variant === 'primary'
    ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
    : variant === 'outline'
      ? 'border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md disabled:hover:bg-white disabled:hover:shadow-none'
      : 'bg-transparent text-primary disabled:hover:bg-transparent'

  return (
    <button className={`${base} ${styles} ${className}`} disabled={disabled} {...rest}>{children}</button>
  )
}
