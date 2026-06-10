import { useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { confirmarPagoManual } from '../api/pagos'

export default function PagoStatusPage() {
  const { status } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id')
  const externalReference = searchParams.get('external_reference')
  const mpStatus = searchParams.get('status')
  
  useEffect(() => {
    // Si Mercado Pago dice que está aprobado, o el path es success
    if (status === 'success' || mpStatus === 'approved') {
      if (externalReference) {
        const pedidoId = parseInt(externalReference)
        if (!isNaN(pedidoId)) {
          confirmarPagoManual(pedidoId).then(() => {
            queryClient.invalidateQueries({ queryKey: ['pedidos'] })
          }).catch(console.error)
        }
      }
    }
  }, [status, mpStatus, externalReference, queryClient])

  const renderContent = () => {
    if (status === 'success') {
      return (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--surface)', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 24px' }}>
            ✓
          </div>
          <h2 style={{ marginBottom: 8, fontSize: 28 }}>¡Listo! Tu pago ya se acreditó</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 15 }}>
            Operación #{paymentId || 'N/A'} {externalReference ? `| Pedido #${externalReference}` : ''}
          </p>
          <div style={{ background: 'var(--bg)', padding: '24px', borderRadius: 12, marginBottom: 32, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 16 }}>Hemos confirmado tu pedido y ya estamos preparándolo.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/mis-pedidos')} style={{ width: '100%', maxWidth: 300, height: 48, fontSize: 16 }}>
            Ver mis pedidos
          </button>
        </div>
      )
    }

    if (status === 'pending') {
      return (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--surface)', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--warning)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 24px' }}>
            ⏳
          </div>
          <h2 style={{ marginBottom: 8, fontSize: 28 }}>Tu pago está pendiente</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 15 }}>
            Operación #{paymentId || 'N/A'} {externalReference ? `| Pedido #${externalReference}` : ''}
          </p>
          <div style={{ background: 'var(--bg)', padding: '24px', borderRadius: 12, marginBottom: 32, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 16 }}>Estamos esperando la confirmación del pago. Te avisaremos en cuanto se acredite.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/mis-pedidos')} style={{ width: '100%', maxWidth: 300, height: 48, fontSize: 16 }}>
            Ir a mis pedidos
          </button>
        </div>
      )
    }

    // Default: failure o cualquier otro
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--surface)', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 24px' }}>
          ✕
        </div>
        <h2 style={{ marginBottom: 8, fontSize: 28 }}>El pago fue rechazado</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 15 }}>
          {externalReference ? `Pedido #${externalReference}` : 'Hubo un problema con la transacción'}
        </p>
        <div style={{ background: 'var(--bg)', padding: '24px', borderRadius: 12, marginBottom: 32, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 16 }}>Tuvimos un problema al procesar tu pago. Por favor, intenta nuevamente con otro medio de pago o tarjeta.</p>
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/mis-pedidos')} style={{ height: 48, padding: '0 24px', fontSize: 16 }}>
            Ver mis pedidos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 150px)', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 500 }}>
        {renderContent()}
      </div>
    </div>
  )
}
