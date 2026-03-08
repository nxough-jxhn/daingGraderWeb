import React, { useState } from 'react'
import LoginForm from '../components/auth/LoginForm'
import RegisterForm from '../components/auth/RegisterForm'
import PageTitleHero from '../components/layout/PageTitleHero'
import { BookOpen, BarChart2, ShieldCheck, Users, Store, Camera, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  return (
    <div className="space-y-8">
      <PageTitleHero
        title={mode === 'login' ? 'Sign in' : 'Create account'}
        description="Academic access to DaingGrader"
        breadcrumb={mode === 'login' ? 'Sign In' : 'Create Account'}
      />
      <div className="flex items-start gap-10">
        {/* Left — form */}
        <div className="w-full max-w-xl card transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
            <div className="text-sm text-muted">Academic access</div>
          </div>
          {mode === 'login' ? <LoginForm /> : <RegisterForm />}
          <div className="mt-4 text-sm text-muted">
            {mode === 'login' ? (
              <span>Don't have an account? <button className="text-primary" onClick={() => setMode('register')}>Register</button></span>
            ) : (
              <span>Already have an account? <button className="text-primary" onClick={() => setMode('login')}>Sign in</button></span>
            )}
          </div>
        </div>

        {/* Right — adaptive info panel */}
        <div className="hidden lg:block w-[460px] flex-shrink-0">
          {mode === 'login' ? (
            <div className="card transition-all duration-200 hover:shadow-lg space-y-5">
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Why join DaingGrader?</h3>
                <p className="text-sm text-slate-900 mt-1">The academic platform for dried fish quality research in the Philippines.</p>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-slate-100" style={{ aspectRatio: '16/9' }}>
                <img
                  src="/assets/login/why-join.png"
                  alt="Why join DaingGrader"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>

              <ul className="space-y-3">
                {[
                  // { icon: BookOpen, text: 'Access curated daing quality datasets for research' },
                  // { icon: BarChart2, text: 'View AI-graded fish quality analytics and trends' },
                  { icon: Camera, text: 'Contribute labeled images to support model training' },
                  { icon: Store, text: 'Purchase premium dried fish from verified sellers' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-slate-700">
                    <Icon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                Secure, email-verified academic access
              </div>
            </div>
          ) : (
            <div className="card transition-all duration-200 hover:shadow-lg space-y-5">
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Get started in minutes</h3>
                <p className="text-sm text-slate-900 mt-1">Create your free account and start contributing to daing research today.</p>
              </div>

              {/* Account types */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-slate-800">User</span>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-600">
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> Browse & buy daing</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> View quality grades</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> Access analytics</li>
                  </ul>
                </div>
                <div className="border border-blue-200 rounded-xl p-3 bg-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-slate-800">Seller</span>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-600">
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> List your products</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> Manage inventory</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> Earn from sales</li>
                  </ul>
                </div>
              </div>

              <ul className="space-y-3">
                {[
                  { icon: Camera, text: 'Contribute images to improve the AI grading model' },
                  { icon: BarChart2, text: 'Track your order and purchase history' },
                  { icon: BookOpen, text: 'Support academic research on dried fish quality' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-slate-700">
                    <Icon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                Privacy-first — your data is never sold or shared
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
