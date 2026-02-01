import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, Github, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-sidebar text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="text-lg font-semibold">DaingGrader</div>
          <p className="text-sm text-white/70 mt-2">
            Dried fish quality grader platform for classification and dataset management.
          </p>
        </div>
        <div>
          <div className="font-semibold text-white/90">Quick Links</div>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li>
              <Link to="/" className="hover:text-white transition-colors duration-200">Home</Link>
            </li>
            <li>
              <Link to="/grade" className="hover:text-white transition-colors duration-200">Grade</Link>
            </li>
            <li>
              <Link to="/history" className="hover:text-white transition-colors duration-200">History</Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-white transition-colors duration-200">About Us</Link>
            </li>
            <li>
              <Link to="/about-daing" className="hover:text-white transition-colors duration-200">About Daing</Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-white transition-colors duration-200">Contact Us</Link>
            </li>
            <li>
              <Link to="/publications/local" className="hover:text-white transition-colors duration-200">Publications (Local)</Link>
            </li>
            <li>
              <Link to="/publications/foreign" className="hover:text-white transition-colors duration-200">Publications (Foreign)</Link>
            </li>
            <li>
              <Link to="/analytics" className="hover:text-white transition-colors duration-200">Analytics</Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-white/90">Contact</div>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
            <Mail className="w-4 h-4 shrink-0" />
            <a href="mailto:example@univ.edu" className="hover:text-white transition-colors duration-200">
              example@univ.edu
            </a>
          </div>
          <div className="mt-3 flex gap-3">
            <a href="#" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200" aria-label="GitHub">
              <Github className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200" aria-label="LinkedIn">
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 text-center text-sm py-4 text-white/60">
        © {new Date().getFullYear()} DaingGrader — Technological University of the Philippines - Taguig
      </div>
    </footer>
  )
}
