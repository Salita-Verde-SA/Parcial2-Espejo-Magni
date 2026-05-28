import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchUsuarios, assignRole, removeRole } from '../api/usuarios'
import { useAuthStore } from '../stores/authStore'
import type { UserPublic } from '../types'

const ROLES_DISPONIBLES = ['ADMIN', 'STOCK', 'PEDIDOS', 'CLIENT']

const ROLE_LABELS: Record<string, string> = {
  ADMIN:   'Administrador',
  STOCK:   'Gestor de Stock',
  PEDIDOS: 'Gestor de Pedidos',
  CLIENT:  'Cliente',
}

export default function AdminUsuariosPage() {
  const queryClient = useQueryClient()
  const currentUserId = useAuthStore((s) => s.userId)

  const { data: usuarios, isLoading, isError } = useQuery<UserPublic[]>({
    queryKey: ['usuarios'],
    queryFn: fetchUsuarios,
  })

  const assignMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) => assignRole(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  })

  const removeMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) => removeRole(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  })

  const isChanging = assignMutation.isPending || removeMutation.isPending

  function handleToggleRole(user: UserPublic, role: string) {
    const hasRole = user.roles.includes(role)
    if (hasRole) {
      removeMutation.mutate({ userId: user.id, role })
    } else {
      assignMutation.mutate({ userId: user.id, role })
    }
  }

  return (
    <>
      <header className="topbar">
        <span className="topbar-title">Gestión de Usuarios</span>
      </header>

      <div className="page-wrapper">
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              Usuarios registrados
              {usuarios && (
                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>
                  ({usuarios.length} total)
                </span>
              )}
            </span>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  {ROLES_DISPONIBLES.map((role) => (
                    <th key={role} style={{ width: 140, textAlign: 'center' }}>
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr className="loading-row">
                    <td colSpan={3 + ROLES_DISPONIBLES.length}>
                      <span className="spinner spinner-dark" /> Cargando...
                    </td>
                  </tr>
                )}
                {isError && (
                  <tr>
                    <td colSpan={3 + ROLES_DISPONIBLES.length} style={{ textAlign: 'center', padding: 24, color: 'var(--danger)' }}>
                      Error al cargar los usuarios. Intentá de nuevo.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && usuarios?.length === 0 && (
                  <tr>
                    <td colSpan={3 + ROLES_DISPONIBLES.length}>
                      <div className="empty-state">
                        <h3>Sin usuarios</h3>
                        <p>No hay usuarios registrados en el sistema.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && usuarios?.map((user) => (
                  <tr key={user.id}>
                    <td className="col-id">#{user.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 30, height: 30,
                          background: 'var(--brand)',
                          borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
                        }}>
                          {user.nombre[0].toUpperCase()}
                        </div>
                        <strong>{user.nombre} {user.apellido}</strong>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{user.email}</td>
                    {ROLES_DISPONIBLES.map((role) => {
                      const hasRole = user.roles.includes(role)
                      const isOwnAdmin = user.id === currentUserId && role === 'ADMIN'
                      return (
                        <td key={role} style={{ textAlign: 'center' }}>
                          <span
                            className={`role-chip ${hasRole ? 'active' : 'inactive'} ${isOwnAdmin || isChanging ? 'disabled' : ''}`}
                            title={isOwnAdmin ? 'No podés remover tu propio rol ADMIN' : ROLE_LABELS[role]}
                            onClick={() => {
                              if (!isOwnAdmin && !isChanging) handleToggleRole(user, role)
                            }}
                          >
                            {hasRole ? '✓' : '+'} {role}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
