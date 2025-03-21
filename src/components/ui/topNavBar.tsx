"use client"

import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import "nes.css/css/nes.min.css"
import "./TopNavBar.css"
import { openAuthSidebar } from "../../store/feature/auth/authSlice"
import { useDispatch } from "react-redux"

export default function TopNavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const dispatch = useDispatch()

  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <nav className="top-nav">
      {/* Logo/Home link */}
      <div className="nav-logo" onClick={() => navigate("/")}>
        MEMEROT
      </div>

      {/* Desktop Navigation */}
      <div className="nav-links">
        <button className={`nav-btn ${isActive("/about") ? "is-active" : ""}`} onClick={() => navigate("/about")}>
          About
        </button>
        <button className={`nav-btn ${isActive("/docs") ? "is-active" : ""}`} onClick={() => navigate("/docs")}>
          Docs
        </button>
        <button className="nav-btn sign-in-btn" onClick={() => dispatch(openAuthSidebar("signin"))}>
          Sign In
        </button>
      </div>

      {/* Mobile menu toggle */}
      <div className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        <div className={`hamburger ${isMobileMenuOpen ? "open" : ""}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${isMobileMenuOpen ? "open" : ""}`}>
        <button
          className={`mobile-nav-btn ${isActive("/about") ? "is-active" : ""}`}
          onClick={() => {
            navigate("/about")
            setIsMobileMenuOpen(false)
          }}
        >
          About
        </button>
        <button
          className={`mobile-nav-btn ${isActive("/docs") ? "is-active" : ""}`}
          onClick={() => {
            navigate("/docs")
            setIsMobileMenuOpen(false)
          }}
        >
          Docs
        </button>
        <button
          className="mobile-nav-btn sign-in-btn"
          onClick={() => {
            dispatch(openAuthSidebar("signin"))
            setIsMobileMenuOpen(false)
          }}
        >
          Sign In
        </button>
      </div>
    </nav>
  )
}
