import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'

/** Instancia global de QueryClient con retry=1 y staleTime de 30 segundos usada por toda la aplicación para el caché de TanStack Query. */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

/** Punto de entrada de la aplicación React; monta el árbol de componentes en el elemento #root del DOM envuelto en StrictMode y QueryClientProvider. */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
