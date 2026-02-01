import React, { useState } from 'react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { sendContactMessage } from '../services/api'
import { Loader2 } from 'lucide-react'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (!email.trim()) {
      setError('Email is required.')
      return
    }
    if (!subject.trim()) {
      setError('Subject is required.')
      return
    }
    if (!message.trim()) {
      setError('Message is required.')
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
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card">
        <h2 className="text-xl font-semibold">Contact Us</h2>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Contact Number" placeholder="e.g. +63 912 345 6789" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
          <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          <div>
            <label className="text-sm text-gray-700 mb-1">Message</label>
            <textarea
              className="w-full p-3 border rounded-md h-36"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              Message sent successfully. We&apos;ll get back to you soon.
            </div>
          )}
          <div>
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
          </div>
        </form>
      </div>

      <div className="card">
        <h3 className="font-semibold">Contact Info</h3>
        <div className="mt-3 text-sm text-muted">
          shathesisgroup@gmail.com<br />
          Messages from the form are sent to this address.
        </div>
        <div className="mt-6 bg-gray-50 p-4 rounded">
          <img
            src="/assets/images/map.png"
            alt="Map"
            className="w-full max-w-[600px] h-[400px] object-cover rounded"
          />
        </div>
      </div>
    </div>
  )
}
