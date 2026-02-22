import React, { useState } from 'react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { sendContactMessage } from '../services/api'
import { Clock, Loader2, Mail, MapPin, MessageCircle, PhoneCall } from 'lucide-react'
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
    <div className="px-6 pb-8 pt-0 max-w-[1400px] mx-auto">
      <PageTitleHero
        title="Contact Us"
        description="Reach out to the DaingGrader team with questions, feedback, or support requests."
        breadcrumb="Contact"
      />

      <div className="relative rounded-2xl border border-slate-200 bg-white/60 shadow-sm overflow-hidden">
        <div className="absolute left-4 top-6 bottom-6 w-[2px] bg-gradient-to-b from-blue-500/50 via-blue-300/40 to-blue-500/50" />
        <div className="pl-8 pr-4 py-4 space-y-4">

          <div className="relative">
            <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-semibold shadow-sm">1 Hub</div>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Talk to us directly.</h2>
                <p className="text-sm text-slate-600 mt-2 max-w-xl">
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
                    href="tel:+639123456789"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold bg-white hover:bg-slate-50 transition-colors"
                  >
                    <PhoneCall className="w-4 h-4" /> Call us
                  </a>
                  <a
                    href="#contact-map"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold bg-white hover:bg-slate-50 transition-colors"
                  >
                    <MapPin className="w-4 h-4" /> Visit us
                  </a>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">Average Response</p>
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="mt-1.5 text-base font-semibold text-slate-900">Within 24 hours</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">Support Hours</p>
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="mt-1.5 text-base font-semibold text-slate-900">Mon-Sat, 9AM-6PM</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">Primary Channel</p>
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="mt-1.5 text-base font-semibold text-slate-900">Email support</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative border-t border-slate-100 pt-4">
            <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-semibold shadow-sm">2 Message</div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Send a message</h3>
                <p className="text-sm text-slate-500 mt-1">Tell us what you need and we will follow up.</p>
              </div>
              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    error={fieldErrors.name || null}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    error={fieldErrors.email || null}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Contact Number"
                    placeholder="e.g. +63 912 345 6789"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    error={fieldErrors.contactNumber || null}
                  />
                  <Input
                    label="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    error={fieldErrors.subject || null}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-700 font-medium mb-1 block">Message</label>
                  <textarea
                    className={`w-full p-3 border bg-white text-slate-900 rounded-md h-36 focus:outline-none focus:ring-2 focus:border-blue-500 transition-all ${
                      fieldErrors.message ? 'border-red-300 focus:ring-red-500/40' : 'border-slate-300 focus:ring-blue-500/40'
                    }`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                  {fieldErrors.message && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.message}</p>
                  )}
                </div>
                {error && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-300 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="text-sm text-green-700 bg-green-50 border border-green-300 rounded-lg px-3 py-2">
                    Message sent successfully. We&apos;ll get back to you soon.
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                        Sending…
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </Button>
                  <span className="text-xs text-slate-500">We usually reply within 24 hours.</span>
                </div>
              </form>
            </div>
          </div>

          <div className="relative border-t border-slate-100 pt-4" id="contact-map">
            <div className="absolute -left-7 -top-2 z-10 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-semibold shadow-sm">3 Info</div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Contact Info</h3>
                  <p className="mt-1 text-sm text-slate-600">shathesisgroup@gmail.com</p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600">
                  <Clock className="w-3.5 h-3.5" /> Fast replies
                </div>
              </div>

              <div className="mt-4 flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setInfoTab('map')}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                    infoTab === 'map' ? 'bg-white text-blue-700 border border-blue-200' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Map
                </button>
                <button
                  type="button"
                  onClick={() => setInfoTab('hours')}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                    infoTab === 'hours' ? 'bg-white text-blue-700 border border-blue-200' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Hours
                </button>
                <button
                  type="button"
                  onClick={() => setInfoTab('faq')}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                    infoTab === 'faq' ? 'bg-white text-blue-700 border border-blue-200' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  FAQ
                </button>
              </div>

              {infoTab === 'map' && (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <img
                    src="/assets/images/map.png"
                    alt="Map"
                    className="w-full h-[280px] object-cover rounded-lg"
                  />
                  <div className="mt-3 text-xs text-slate-600">
                    Technological University of the Philippines, Taguig City
                  </div>
                </div>
              )}

              {infoTab === 'hours' && (
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Monday - Friday</span>
                    <span className="font-medium">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Saturday</span>
                    <span className="font-medium">9:00 AM - 3:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sunday</span>
                    <span className="font-medium">Closed</span>
                  </div>
                  <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                    Need something urgent? Email us and mark the subject as "Urgent".
                  </div>
                </div>
              )}

              {infoTab === 'faq' && (
                <div className="mt-4 space-y-3">
                  <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-800">How fast do you reply?</summary>
                    <p className="mt-2 text-xs text-slate-600">We usually respond within 24 hours on business days.</p>
                  </details>
                  <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-800">Can I request a demo?</summary>
                    <p className="mt-2 text-xs text-slate-600">Yes. Use the form and select "Demo" in your subject.</p>
                  </details>
                  <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-800">Where are you located?</summary>
                    <p className="mt-2 text-xs text-slate-600">Taguig City, near TUP Taguig campus.</p>
                  </details>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
