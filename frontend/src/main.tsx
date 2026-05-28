import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'
import { initMercadoPago } from '@mercadopago/sdk-react'

// Inicializar MercadoPago con la clave pública configurada en .env
initMercadoPago((import.meta as any).env.VITE_MP_PUBLIC_KEY || 'TEST-xxxx')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
