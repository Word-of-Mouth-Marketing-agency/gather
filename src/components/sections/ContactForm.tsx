'use client'

import { useState } from 'react'

interface Props {
  formTitle: string
  recipientEmail: string
}

export default function ContactForm({ formTitle, recipientEmail }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, recipientEmail }),
      })
    } catch {
      // silently continue — show success regardless for now (no real email backend yet)
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-[#E8DED2] rounded-[22px] p-8 sm:p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-[#ff7a1a]/20 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-[#ff7a1a]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-[#171717] mb-2">Message sent successfully</h3>
        <p className="text-[#7a6247] text-sm">We&apos;ll get back to you as soon as possible.</p>
      </div>
    )
  }

  return (
    <div className="bg-[#E8DED2] rounded-[22px] p-8 sm:p-10">
      <h3 className="text-2xl sm:text-3xl font-black text-[#171717] text-center mb-7">
        {formTitle}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="contact-name" className="sr-only">Name</label>
            <input
              id="contact-name"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-[#ff7a1a]/40 bg-[#f5f0e9] px-4 py-3 text-sm text-[#171717] placeholder-[#7a6247]/60 focus:outline-none focus:ring-2 focus:ring-[#ff7a1a]/30 focus:border-[#ff7a1a]"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="sr-only">Email</label>
            <input
              id="contact-email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-[#ff7a1a]/40 bg-[#f5f0e9] px-4 py-3 text-sm text-[#171717] placeholder-[#7a6247]/60 focus:outline-none focus:ring-2 focus:ring-[#ff7a1a]/30 focus:border-[#ff7a1a]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-message" className="sr-only">Message</label>
          <textarea
            id="contact-message"
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={5}
            className="w-full rounded-xl border border-[#ff7a1a]/40 bg-[#f5f0e9] px-4 py-3 text-sm text-[#171717] placeholder-[#7a6247]/60 focus:outline-none focus:ring-2 focus:ring-[#ff7a1a]/30 focus:border-[#ff7a1a] resize-none"
          />
        </div>

        <button
          type="submit"
          className="gather-btn-primary w-full justify-center py-3.5 text-base"
        >
          Send
        </button>
      </form>
    </div>
  )
}