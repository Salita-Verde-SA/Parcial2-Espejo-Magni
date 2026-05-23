// ─── main.tsx ────────────────────────────────────────────────────────────────
// Punto de entrada de la aplicación React.
// Este es el primer archivo que ejecuta el navegador al cargar la SPA.
// Se encarga de montar el árbol de componentes en el <div id="root"> del HTML.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'   // importa los estilos globales
import App from './App'

// QueryClient: instancia central de TanStack Query que gestiona el caché
// de todas las peticiones HTTP de la app. Las queries comparten este caché.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,        // si una petición falla, lo reintenta solo 1 vez
      staleTime: 30_000, // los datos se consideran "frescos" durante 30 segundos
                         // → no vuelve a pedir al servidor en ese período
    },
  },
})

// createRoot: API moderna de React 18 para montar la app en el DOM.
// document.getElementById('root')! → el "!" le dice a TypeScript que el elemento
// existe y no es null (ya que lo definimos en index.html).
createRoot(document.getElementById('root')!).render(
  // StrictMode: modo de desarrollo que detecta problemas comunes.
  // En producción no tiene efecto.
  <StrictMode>
    {/* QueryClientProvider: proveedor de contexto que hace disponible
        el queryClient a todos los componentes hijos mediante hooks. */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
