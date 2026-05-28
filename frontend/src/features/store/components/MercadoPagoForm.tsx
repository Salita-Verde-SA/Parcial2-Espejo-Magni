import { useState } from 'react'
import { CardPayment } from '@mercadopago/sdk-react'
import { usePaymentStore } from '../../../stores/paymentStore'
import { createPago } from '../../../api/pagos'

export default function MercadoPagoForm({ pedidoId, onSuccess }: { pedidoId: number, onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const setPaymentStatus = usePaymentStore(s => s.setPaymentStatus)

  const initialization = {
    amount: 100, // MercadoPago SDK requires an amount, though real amount is handled by backend
  }

  const onSubmit = async (formData: any) => {
    try {
      setPaymentStatus('processing')
      setError(null)
      const res = await createPago(
        formData.token, 
        pedidoId, 
        formData.issuer_id, 
        formData.payment_method_id, 
        formData.installments
      )
      if (res.status === 'ok') {
        setPaymentStatus('approved')
        onSuccess()
      } else {
        setPaymentStatus('rejected')
        setError('El pago fue rechazado o está pendiente de revisión.')
      }
    } catch (e: any) {
      setPaymentStatus('error')
      setError(e.response?.data?.detail || 'Error al procesar el pago')
    }
  }

  const onError = async (error: any) => {
    console.error('MercadoPago error:', error)
    setError('Ocurrió un error al cargar el formulario de pago.')
  }

  const onReady = async () => {
    // Form is ready
  }

  return (
    <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: '#fff' }}>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      <CardPayment
        initialization={initialization}
        onSubmit={onSubmit}
        onReady={onReady}
        onError={onError}
      />
    </div>
  )
}
