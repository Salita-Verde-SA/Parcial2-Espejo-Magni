// ─── pages/LoginPage.tsx ──────────────────────────────────────────────────────
// Página de inicio de sesión.
// Es la única ruta pública de la app (no requiere estar autenticado).
// Al hacer submit llama a login() de la API, y si es exitoso redirige a "/".

import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')     // mensaje de error a mostrar
  const [loading, setLoading]   = useState(false)  // deshabilita el botón mientras carga

  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? 'Email o contraseña incorrectos'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#08080A] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-[420px] bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-[0_8px_32px_rgba(220,38,38,0.4)] mb-6">
            <span className="text-2xl font-black text-white tracking-tighter">FF</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">Fast Food Admin</h1>
          <p className="text-sm text-neutral-400 font-medium">Ingresa tus credenciales para continuar</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-neutral-300" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@fastfood.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black/20 border border-white/10 text-white placeholder-neutral-600 rounded-xl px-4 py-3.5 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all duration-300"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-neutral-300" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-black/20 border border-white/10 text-white placeholder-neutral-600 rounded-xl px-4 py-3.5 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all duration-300"
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl px-4 py-4 shadow-[0_8px_20px_rgba(220,38,38,0.25)] hover:shadow-[0_10px_25px_rgba(220,38,38,0.4)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center uppercase tracking-widest text-sm border-none appearance-none"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Ingresar al sistema'}
            </button>
          </div>
        </form>

        {/* Test Credentials */}
        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <p className="text-[13px] text-neutral-500 font-medium">
            <span className="block mb-1">admin@fastfood.com <span className="mx-1 opacity-50">|</span> Admin1234!</span>
            <span className="block">juan@fastfood.com <span className="mx-1 opacity-50">|</span> Juan1234!</span>
          </p>
        </div>
      </div>
    </div>
  )
}
