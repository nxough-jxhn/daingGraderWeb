import React, { useState } from 'react'
import LoginForm from '../components/auth/LoginForm'
import RegisterForm from '../components/auth/RegisterForm'
import PageTitleHero from '../components/layout/PageTitleHero'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  return (
    <div className="space-y-8">
      <PageTitleHero
        title={mode === 'login' ? 'Sign in' : 'Create account'}
        subtitle="Academic access to DaingGrader"
        backgroundImage="/assets/page-hero/login.jpg"
      />
      <div className="flex items-start gap-12">
      <div className="w-full max-w-xl card transition-all duration-200 hover:shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
          <div className="text-sm text-muted">Academic access</div>
        </div>
        {mode === 'login' ? <LoginForm /> : <RegisterForm />}
        <div className="mt-4 text-sm text-muted">
          {mode === 'login' ? (
            <span>Don't have an account? <button className="text-primary" onClick={()=>setMode('register')}>Register</button></span>
          ) : (
            <span>Already have an account? <button className="text-primary" onClick={()=>setMode('login')}>Sign in</button></span>
          )}
        </div>
      </div>

      <div className="hidden lg:block w-96">
        <div className="card transition-all duration-200 hover:shadow-lg">
          <h3 className="font-semibold">Why join?</h3>
          <p className="text-sm text-muted mt-2">Access dataset, contribute images, and view analytics for research.</p>
          <div className="mt-4 bg-gray-50 rounded-md p-4 text-center text-muted">Insert image here — 800x600</div>
        </div>
      </div>
      </div>
    </div>
  )
}
