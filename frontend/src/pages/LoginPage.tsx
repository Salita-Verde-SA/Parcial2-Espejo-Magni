// ─── pages/LoginPage.tsx ──────────────────────────────────────────────────────
// Página de inicio de sesión.
// Es la única ruta pública de la app (no requiere estar autenticado).
// Al hacer submit llama a login() de la API, y si es exitoso redirige a "/".

import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'

export default function LoginPage() {
  // useState: estado local del componente (no necesita store global)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')     // mensaje de error a mostrar
  const [loading, setLoading]   = useState(false)  // deshabilita el botón mientras carga

  const navigate = useNavigate()

  // ─── handleSubmit ─────────────────────────────────────────────────────────
  // Se llama al enviar el formulario.
  // Patrón estándar: try/catch/finally para manejar el estado de carga.
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()   // evita que el navegador recargue la página (comportamiento default del form)
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      // Si login() no lanzó error → credenciales correctas → redirige
      navigate('/', { replace: true })  // replace: true → no puede volver con "Atrás" al login
    } catch (err: unknown) {
      // Extrae el mensaje de error del backend (FastAPI devuelve { detail: "..." })
      // La cadena de "?" (optional chaining) evita crashes si alguna parte es undefined
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? 'Email o contraseña incorrectos'
      setError(msg)
    } finally {
      setLoading(false)  // siempre se ejecuta, tanto si hay error como si no
    }
  }

  return (
    <div className="login-page">
      {/* Tarjeta blanca flotante sobre el fondo oscuro */}
      <div className="login-card">

        {/* Logo de la app */}
        <div className="login-logo">
          <div className="login-logo-mark">FF</div>
          <h1>Fast Food Admin</h1>
          <p>Ingresá con tu cuenta para continuar</p>
        </div>

        {/* Mensaje de error (solo se muestra si error !== "") */}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="form-input"
              type="email"
              autoComplete="email"
              placeholder="admin@fastfood.com"
              value={email}
              // Patrón controlled input: el valor del input siempre es el del estado
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              className="form-input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* disabled={loading}: bloquea el botón mientras espera la respuesta */}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {/* Muestra spinner girando mientras carga, si no muestra texto */}
            {loading ? <span className="spinner" /> : 'Ingresar'}
          </button>
        </form>

        {/* Credenciales de prueba para facilitar el desarrollo/presentación */}
        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 12 }}>
          admin@fastfood.com / Admin1234! · juan@fastfood.com / Juan1234!
        </p>
      </div>
    </div>
  )
}
