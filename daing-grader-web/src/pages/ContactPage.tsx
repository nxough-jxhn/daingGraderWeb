import React, { useState } from 'react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { sendContactMessage } from '../services/api'
import { Clock, Loader2, Mail, MapPin, MessageCircle, X } from 'lucide-react'
import { validateName, validateEmail, validatePhone, validateLength } from '../utils/validation'
import PageTitleHero from '../components/layout/PageTitleHero'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [infoTab, setInfoTab] = useState<'map' | 'hours' | 'faq'>('map')
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([
    { from: 'bot', text: 'Hi! How can we help you today?' },
  ])
  const [chatOpen, setChatOpen] = useState(false)

  const FAQ_ANSWERS: Record<string, string> = {
    'how fast': 'We usually respond within 24 hours on business days.',
    'reply': 'We usually respond within 24 hours on business days.',
    'demo': 'Yes! Use the contact form and write "Demo" in the subject line.',
    'where': 'We are at Technological University of the Philippines, Taguig City.',
    'location': 'We are at TUP Taguig, Taguig City, Philippines.',
    'hours': 'Our support hours are Monday-Saturday, 9:00 AM - 6:00 PM.',
    'email': 'You can reach us at shathesisgroup@gmail.com.',
    'phone': 'Call us at +63 912 345 6789.',
    'hello': 'Hello! Ask us anything about DaingGrader. ðŸ˜Š',
    'hi': 'Hi there! How can we help you?',
  }

  const handleChatSend = () => {
    const trimmed = chatInput.trim()
    if (!trimmed) return
    const lower = trimmed.toLowerCase()
    const matchKey = Object.keys(FAQ_ANSWERS).find((k) => lower.includes(k))
    const botReply = matchKey
      ? FAQ_ANSWERS[matchKey]
      : 'Great question! Please use the message form to reach us and we will get back to you soon.'
    setChatMessages((prev) => [...prev, { from: 'user', text: trimmed }, { from: 'bot', text: botReply }])
    setChatInput('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setFieldErrors({})
    
    // Validate all fields
    const errors: Record<string, string> = {}
    
    const nameValidation = validateName(name, 'Name')
    if (!nameValidation.valid) errors.name = nameValidation.error!
    
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) errors.email = emailValidation.error!
    
    if (contactNumber.trim()) {
      const phoneValidation = validatePhone(contactNumber)
      if (!phoneValidation.valid) errors.contactNumber = phoneValidation.error!
    }
    
    const subjectValidation = validateLength(subject, 3, 200, 'Subject')
    if (!subjectValidation.valid) errors.subject = subjectValidation.error!
    
    const messageValidation = validateLength(message, 10, 2000, 'Message')
    if (!messageValidation.valid) errors.message = messageValidation.error!
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    
    setLoading(true)
    try {
      await sendContactMessage({
        name: name.trim(),
        email: email.trim(),
        contact_number: contactNumber.trim(),
        subject: subject.trim(),
        message: message.trim(),
      })
      setSuccess(true)
      setName('')
      setEmail('')
      setContactNumber('')
      setSubject('')
      setMessage('')
      setFieldErrors({})
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: any) => d?.msg ?? d).join(', ')
            : err.message || 'Failed to send message. Is the backend running?'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageTitleHero
        title="Contact Us"
        description="Reach out to the DaingGrader team with questions, feedback, or support requests."
        breadcrumb="Contact"
      />

      {/* Single row: Left (Hub + Form) | Right (Map) */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch" id="contact-map">

        {/* Left: Hub + Form combined */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-5">

          {/* Hub */}
          <div>
            <h2 className="text-xl font-bold text-slate-900">Talk to us directly.</h2>
            <p className="text-sm text-slate-600 mt-2">
              Whether you need help, want to collaborate, or have product feedback, our team is ready to assist.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <a
                href="mailto:shathesisgroup@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                <Mail className="w-4 h-4" /> Email us
              </a>
              <a
                href="#contact-map"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold bg-white hover:bg-slate-50 transition-colors"
              >
                <MapPin className="w-4 h-4" /> Visit us
              </a>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Avg Response</p>
                <p className="mt-1 text-sm font-bold text-slate-900">Within 24 hrs</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Support Hours</p>
                <p className="mt-1 text-sm font-bold text-slate-900">Mon-Sat 9-6PM</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Channel</p>
                <p className="mt-1 text-sm font-bold text-slate-900">Email</p>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Form */}
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">Send a message</h3>
            <p className="text-sm text-slate-500 mt-1">Tell us what you need and we will follow up.</p>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required error={fieldErrors.name || null} />
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required error={fieldErrors.email || null} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Contact Number" placeholder="e.g. +63 912 345 6789" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} error={fieldErrors.contactNumber || null} />
                <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required error={fieldErrors.subject || null} />
              </div>
              <div>
                <label className="text-sm text-slate-700 font-medium mb-1 block">Message</label>
                <textarea
                  className={`w-full p-3 border bg-white text-slate-900 rounded-md h-28 focus:outline-none focus:ring-2 focus:border-blue-500 transition-all ${
                    fieldErrors.message ? 'border-red-300 focus:ring-red-500/40' : 'border-slate-300 focus:ring-blue-500/40'
                  }`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
                {fieldErrors.message && <p className="mt-1 text-xs text-red-600">{fieldErrors.message}</p>}
              </div>
              {error && <div className="text-sm text-red-700 bg-red-50 border border-red-300 rounded-lg px-3 py-2">{error}</div>}
              {success && <div className="text-sm text-green-700 bg-green-50 border border-green-300 rounded-lg px-3 py-2">Message sent successfully. We'll get back to you soon.</div>}
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Sending...</> : 'Send Message'}
                </Button>
                <span className="text-xs text-slate-500">We usually reply within 24 hours.</span>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Map */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Our Location</h3>
              <p className="text-xs text-slate-500 mt-0.5">Technological University of the Philippines, Taguig City</p>
            </div>
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <iframe
            title="TUP Taguig Map"
            src="https://maps.google.com/maps?q=Technological+University+of+the+Philippines+Taguig,+Km+14+East+Service+Road,+Western+Bicutan,+Taguig+City&t=&z=16&ie=UTF8&iwloc=&output=embed"
            className="flex-1 w-full"
            style={{ border: 0, minHeight: '480px' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="px-5 py-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
              shathesisgroup@gmail.com
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
              Mon-Sat, 9AM-6PM
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
              Taguig City, PH
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating chat widget (bottom-right) ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

        {/* Chat panel — shown when open */}
        {chatOpen && (
          <div className="w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-600">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">DaingGrader Support</p>
                <p className="text-[10px] text-blue-100">Usually replies within 24 hours</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-300"></span>
                  <span className="text-[10px] text-blue-100">Online</span>
                </div>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>

            {/* Suggestion chips */}
            <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2 border-b border-slate-100">
              {['How fast do you reply?', 'Where are you?', 'Support hours', 'Request a demo'].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setChatInput(q)}
                  className="text-[11px] px-3 py-1 rounded-full border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="overflow-y-auto px-4 py-3 space-y-3 min-h-[160px] max-h-[200px]">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.from === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      <MessageCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.from === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                  placeholder="Ask a quick question..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleChatSend}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toggle button */}
        <button
          type="button"
          onClick={() => setChatOpen((v) => !v)}
          className="flex items-center gap-2 bg-blue-600 text-white pl-2.5 pr-4 py-2.5 rounded-2xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
        >
          <img
            src="/assets/logos/dainggrader-logo.png"
            alt="DaingGrader"
            className="w-7 h-7 rounded-full object-cover bg-white/20"
          />
          {chatOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <>
              <span className="text-sm font-semibold">Support</span>
              <MessageCircle className="w-4 h-4 opacity-80" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
