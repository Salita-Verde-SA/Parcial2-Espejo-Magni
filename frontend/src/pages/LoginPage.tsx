import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
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
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Email o contraseña incorrectos'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">

      <div className="login-brand-panel">
        <div className="login-brand-content">
          <div className="login-brand-logo">FF</div>
          <h1 className="login-brand-title">Fast Food<br />Admin Panel</h1>
          <p className="login-brand-subtitle">
            Gestioná tu negocio desde un solo lugar.
          </p>
          <div className="login-feature-list">
            <div className="login-feature-item">
              <span className="login-feature-dot" />
              Gestión de productos e ingredientes
            </div>
            <div className="login-feature-item">
              <span className="login-feature-dot" />
              Control de pedidos en tiempo real
            </div>
            <div className="login-feature-item">
              <span className="login-feature-dot" />
              Administración de usuarios y roles
            </div>
            <div className="login-feature-item">
              <span className="login-feature-dot" />
              Categorías jerárquicas y catálogo
            </div>
          </div>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-wrapper">

          <div className="login-form-header">
            <h2>Iniciar sesión</h2>
            <p>Ingresá con tu cuenta para continuar</p>
          </div>

          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                className="form-input"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 8 }}
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="login-demo-creds">
            <strong>Credenciales de prueba</strong>
            admin@fastfood.com · Admin1234!<br />
            stock@fastfood.com · Stock1234!<br />
            pedidos@fastfood.com · Ped1234!<br />
            juan@fastfood.com · Juan1234!
          </div>

        </div>
      </div>

    </div>
  )
}
