import { useQuery } from '@tanstack/react-query'
import { fetchDashboardData } from '../api/admin'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS: Record<string, string> = {
  'PENDIENTE': '#f59e0b', // amber-500
  'CONFIRMADO': '#3b82f6', // blue-500
  'EN_PREP': '#8b5cf6', // violet-500
  'EN_CAMINO': '#6366f1', // indigo-500
  'ENTREGADO': '#10b981', // emerald-500
  'CANCELADO': '#ef4444', // red-500
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchDashboardData,
  })

  if (isLoading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}>
        <span className="spinner spinner-dark" style={{ width: 40, height: 40 }} />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', marginTop: 100, color: 'var(--danger)' }}>
        <h2>Error al cargar el dashboard</h2>
      </div>
    )
  }

  // Preparamos datos para Recharts
  const chartData = Object.entries(data.pedidos_por_estado).map(([estado, cantidad]) => ({
    estado,
    cantidad,
  }))

  return (
    <>
      <header className="topbar">
        <span className="topbar-title">Dashboard</span>
      </header>

      <div className="page-wrapper" style={{ maxWidth: 1400, margin: '0 auto' }}>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 350px) 1fr',
          gap: 32,
          alignItems: 'start'
        }}>

          {/* Columna Izquierda: KPIs Stackeados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            <div className="card" style={{
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              borderLeft: '4px solid #3b82f6',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Pedidos Registrados
              </span>
              <span style={{ fontSize: 42, fontWeight: 900, color: '#111827', lineHeight: 1 }}>
                {data.total_pedidos}
              </span>
            </div>

            <div className="card" style={{
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              borderLeft: '4px solid #10b981',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Catálogo de Productos
              </span>
              <span style={{ fontSize: 42, fontWeight: 900, color: '#111827', lineHeight: 1 }}>
                {data.total_productos}
              </span>
            </div>

            <div className="card" style={{
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              borderLeft: '4px solid #8b5cf6',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Usuarios Activos
              </span>
              <span style={{ fontSize: 42, fontWeight: 900, color: '#111827', lineHeight: 1 }}>
                {data.total_usuarios}
              </span>
            </div>

          </div>

          {/* Columna Derecha: Gráfico Principal */}
          <div className="card" style={{
            padding: 32,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
            height: '100%'
          }}>
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ margin: 0, fontSize: 20, color: '#111827', fontWeight: 700 }}>Flujo de Pedidos por Estado</h3>
              <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
                Distribución en tiempo real de los pedidos según su etapa actual.
              </p>
            </div>

            {chartData.length > 0 ? (
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000000ff" />
                    <XAxis dataKey="estado" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }} dy={16} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                      contentStyle={{ borderRadius: 12, border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 600, padding: '12px 16px' }}
                    />
                    <Bar dataKey="cantidad" radius={[6, 6, 0, 0]} maxBarSize={50} animationDuration={1500}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.estado] || '#9ca3af'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No hay pedidos registrados todavía.
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
