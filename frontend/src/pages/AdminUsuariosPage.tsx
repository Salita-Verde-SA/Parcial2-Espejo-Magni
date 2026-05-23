import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchUsuarios, assignRole, removeRole } from '../api/usuarios'
import { useAuthStore } from '../stores/authStore'
import type { UserPublic } from '../types'

const ROLES_DISPONIBLES = ['ADMIN', 'STOCK', 'PEDIDOS', 'CLIENT']

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

  const handleToggleRole = (user: UserPublic, role: string) => {
    const hasRole = user.roles.includes(role)
    if (hasRole) {
      removeMutation.mutate({ userId: user.id, role })
    } else {
      assignMutation.mutate({ userId: user.id, role })
    }
  }

  if (isLoading) return <div className="p-8">Cargando usuarios...</div>
  if (isError) return <div className="p-8 text-red-500">Error al cargar usuarios</div>

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
          Gestión de Usuarios
        </h1>
      </div>

      <div className="bg-surface rounded-xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 font-semibold text-black/70">Nombre</th>
                <th className="p-4 font-semibold text-black/70">Email</th>
                {ROLES_DISPONIBLES.map(role => (
                  <th key={role} className="p-4 font-semibold text-black/70 text-center">{role}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios?.map((user) => (
                <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium text-black/70">{user.nombre} {user.apellido}</td>
                  <td className="p-4 text-black/70">{user.email}</td>
                  {ROLES_DISPONIBLES.map(role => {
                    const hasRole = user.roles.includes(role)
                    const isOwnAdmin = user.id === currentUserId && role === 'ADMIN'
                    const isChanging = (assignMutation.isPending || removeMutation.isPending)

                    return (
                      <td key={role} className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={hasRole}
                          disabled={isChanging || isOwnAdmin}
                          title={isOwnAdmin ? "No puedes remover tu propio rol de administrador" : ""}
                          onChange={() => handleToggleRole(user, role)}
                          className="w-5 h-5 accent-primary cursor-pointer disabled:opacity-50"
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
              {usuarios?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-white/50">
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
