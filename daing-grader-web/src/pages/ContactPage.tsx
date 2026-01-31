import React from 'react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function ContactPage(){
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card">
        <h2 className="text-xl font-semibold">Contact Us</h2>
        <form className="mt-4 space-y-3">
          <Input label="Name" />
          <Input label="Email" />
          <Input label="Contact Number" placeholder="e.g. +63 912 345 6789" />
          <Input label="Subject" />
          <div>
            <label className="text-sm text-gray-700 mb-1">Message</label>
            <textarea className="w-full p-3 border rounded-md h-36" />
          </div>
          <div><Button>Send Message</Button></div>
        </form>
      </div>

      <div className="card">
        <h3 className="font-semibold">Contact Info</h3>
        <div className="mt-3 text-sm text-muted">example@univ.edu<br/>+63 912 345 6789</div>
        <div className="mt-6 bg-gray-50 p-4 rounded">Map placeholder — 600x400</div>
      </div>
    </div>
  )
}
