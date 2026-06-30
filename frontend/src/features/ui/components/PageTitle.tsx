import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const titles: [RegExp, string][] = [
  [/^\/login$/, 'FastFood • Login'],
  [/^\/catalogo$/, 'FastFood • Catálogo'],
  [/^\/checkout$/, 'FastFood • Checkout'],
  [/^\/mis-pedidos$/, 'FastFood • Mis Pedidos'],
  [/^\/pago\//, 'FastFood • Pago'],
  [/^\/ingredientes$/, 'FastFood • Insumos'],
  [/^\/productos$/, 'FastFood • Productos'],
  [/^\/categorias$/, 'FastFood • Categorías'],
  [/^\/usuarios$/, 'FastFood • Usuarios'],
  [/^\/admin\/pedidos$/, 'FastFood • Pedidos'],
  [/^\/admin\/dashboard$/, 'FastFood • Dashboard'],
]

export default function PageTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    const match = titles.find(([re]) => re.test(pathname))
    document.title = match ? match[1] : 'FastFood'
  }, [pathname])

  return null
}
