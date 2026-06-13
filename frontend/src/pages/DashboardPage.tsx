import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  fetchResumen, fetchVentas, fetchProductosTop, fetchPedidosPorEstado, fetchIngresos,
} from '../api/estadisticas'

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: '#f59e0b',
  CONFIRMADO: '#3b82f6',
  EN_PREP: '#8b5cf6',
  ENTREGADO: '#10b981',
  CANCELADO: '#ef4444',
}
const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']

function fmtMoney(n: number | string) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(n))
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 6, borderLeft: `4px solid ${color}` }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 30, fontWeight: 900, color: 'var(--text)', lineHeight: 1.1 }}>{value}</span>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700 }}>{title}</h3>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>{children as any}</ResponsiveContainer>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  // refetchInterval mantiene los KPIs frescos; los hooks WS invalidan ['estadisticas'].
  const resumen = useQuery({ queryKey: ['estadisticas', 'resumen'], queryFn: fetchResumen, refetchInterval: 30_000 })
  const ventas = useQuery({ queryKey: ['estadisticas', 'ventas'], queryFn: () => fetchVentas('day') })
  const productos = useQuery({ queryKey: ['estadisticas', 'productos-top'], queryFn: () => fetchProductosTop(5) })
  const estados = useQuery({ queryKey: ['estadisticas', 'pedidos-por-estado'], queryFn: fetchPedidosPorEstado })
  const ingresos = useQuery({ queryKey: ['estadisticas', 'ingresos'], queryFn: fetchIngresos })

  const ventasData = (ventas.data ?? []).map((v) => ({
    periodo: v.periodo, total: Number(v.total_ventas), pedidos: v.cantidad_pedidos,
  }))
  const productosData = (productos.data ?? []).map((p) => ({
    nombre: p.nombre.length > 14 ? p.nombre.slice(0, 14) + '…' : p.nombre,
    ingresos: Number(p.ingresos), cantidad: p.cantidad_vendida,
  }))
  const estadosData = (estados.data ?? []).map((e) => ({ name: e.estado_codigo, value: e.cantidad }))
  const ingresosData = (ingresos.data ?? []).map((i) => ({
    forma: i.forma_pago_codigo, total: Number(i.total), cantidad: i.cantidad,
  }))

  return (
    <>
      <header className="topbar">
        <span className="topbar-title">Dashboard</span>
      </header>

      <div className="page-wrapper" style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <KpiCard label="Ventas de hoy" value={fmtMoney(resumen.data?.ventas_hoy ?? 0)} color="#3b82f6" />
          <KpiCard label="Ticket promedio" value={fmtMoney(resumen.data?.ticket_promedio ?? 0)} color="#10b981" />
          <KpiCard label="Pedidos activos" value={String(resumen.data?.pedidos_activos ?? 0)} color="#f59e0b" />
          <KpiCard label="Ventas del mes" value={fmtMoney(resumen.data?.ventas_mes ?? 0)} color="#8b5cf6" />
        </div>

        {/* Gráficos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>

          <ChartCard title="Ventas por período">
            <LineChart data={ventasData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line yAxisId="l" type="monotone" dataKey="total" name="Ventas ($)" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line yAxisId="r" type="monotone" dataKey="pedidos" name="Pedidos" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartCard>

          <ChartCard title="Top productos (ingresos)">
            <BarChart data={productosData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any, n: any) => (n === 'ingresos' ? fmtMoney(v) : v)} />
              <Bar dataKey="ingresos" name="Ingresos" radius={[6, 6, 0, 0]}>
                {productosData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ChartCard>

          <ChartCard title="Distribución por estado">
            <PieChart>
              <Pie data={estadosData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {estadosData.map((e, i) => <Cell key={i} fill={ESTADO_COLORS[e.name] || BAR_COLORS[i % BAR_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ChartCard>

          <ChartCard title="Ingresos por forma de pago">
            <BarChart layout="vertical" data={ingresosData} margin={{ top: 8, right: 16, left: 30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="forma" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(v: any) => fmtMoney(v)} />
              <Bar dataKey="total" name="Total" radius={[0, 6, 6, 0]}>
                {ingresosData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ChartCard>

        </div>
      </div>
    </>
  )
}
