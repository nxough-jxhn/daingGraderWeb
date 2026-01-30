import React from 'react'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline'
}

export default function Button({variant='primary', children, className='', disabled, ...rest}: Props){
  const base = 'px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  const styles = variant === 'primary'
    ? 'bg-primary text-white shadow-sm hover:shadow-md disabled:hover:shadow-sm'
    : variant === 'outline'
      ? 'border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:hover:bg-white'
      : 'bg-transparent text-primary disabled:hover:bg-transparent'

  return (
    <button className={`${base} ${styles} ${className}`} disabled={disabled} {...rest}>{children}</button>
  )
}
