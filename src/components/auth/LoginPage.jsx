// src/components/auth/LoginPage.jsx
import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mountain, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle()
      navigate(from, { replace: true })
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-2xl bg-app-primary/10 text-app-primary mb-3">
            <Mountain size={28} />
          </div>
          <h1 className="text-xl font-semibold text-app-text">Welcome back</h1>
          <p className="text-sm text-app-muted mt-1">Sign in to plan your next trip</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 bg-app-surface border border-app-border rounded-2xl p-6">
          {error && (
            <div className="text-sm text-app-danger bg-app-danger/10 border border-app-danger/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-app-primary/40"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-app-primary/40"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-app-primary text-app-primaryText font-medium py-2.5 text-sm hover:brightness-110 transition disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Sign in
          </button>

          <div className="flex items-center gap-2 py-1">
            <div className="h-px bg-app-border flex-1" />
            <span className="text-xs text-app-muted">or</span>
            <div className="h-px bg-app-border flex-1" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-app-border py-2.5 text-sm font-medium text-app-text hover:bg-app-surfaceAlt transition disabled:opacity-60"
          >
            Continue with Google
          </button>
        </form>

        <p className="text-center text-sm text-app-muted mt-4">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-app-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export function friendlyAuthError(err) {
  const code = err?.code || ''
  const map = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account with that email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/invalid-email': 'Enter a valid email address.',
  }
  return map[code] || err?.message || 'Something went wrong. Please try again.'
}
