// ============================================================================
// Header Component
// ============================================================================
import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, Settings, User, Bell, Search } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const userMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
    setIsUserMenuOpen(false)
  }

  const navItems = [
    { label: 'Home', path: '/home' },
    { label: 'Sessions', path: '/sessions' },
    { label: 'Hub', path: '/hub' },
    { label: 'Networking', path: '/networking' }
  ]

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
      <div className="container-max px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - FIXED: Removed hidden sm:inline so it shows on all mobile screens */}
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="font-bold text-lg text-neutral-900 tracking-tight">
              EventAI
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-blue-600'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <Search className="w-5 h-5 text-neutral-600" />
            </button>
            <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-neutral-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 sm:px-3 sm:py-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-200">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-neutral-600 truncate">{user?.email}</p>
                  </div>
                  <div className="py-2">
                    <button onClick={() => { navigate('/profile'); setIsUserMenuOpen(false); }} className="w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 flex items-center gap-3">
                      <User className="w-4 h-4" /> View Profile
                    </button>
                    {user?.is_admin && (
                      <button onClick={() => { navigate('/admin'); setIsUserMenuOpen(false); }} className="w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 flex items-center gap-3">
                        <Settings className="w-4 h-4" /> Admin Dashboard
                      </button>
                    )}
                  </div>
                  <div className="border-t border-neutral-200 py-2">
                    <button onClick={handleLogout} className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5 text-neutral-600" /> : <Menu className="w-5 h-5 text-neutral-600" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMenuOpen && (
          <nav className="md:hidden border-t border-neutral-200 py-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                className={`block w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path ? 'bg-blue-50 text-blue-600 font-medium' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header