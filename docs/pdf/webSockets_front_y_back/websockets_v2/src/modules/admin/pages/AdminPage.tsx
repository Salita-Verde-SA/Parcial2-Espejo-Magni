import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as pedidosApi from "../../../api/pedidosApi";
import type { PedidoEstado, PedidoPublic } from "../../../types/api";
import { EstadoBadge } from "../../../components/ui/EstadoBadge";
import { useWebSocket, type WsMessage } from "../../../hooks/useWebSocket";
import { useAuthStore } from "../../../stores/useAuthStore";

const ESTADOS: PedidoEstado[] = [
  "pendiente",
  "confirmado",
  "preparando",
  "listo",
  "entregado",
  "cancelado",
];

export const AdminPage = () => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    data: pedidos = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["pedidos", "admin"],
    queryFn: pedidosApi.getPedidos,
  });

  useWebSocket({
    enabled: isAuthenticated,
    onMessage: useCallback(
      (msg: WsMessage) => {
        if (msg.event === "WS_CONNECTED") {
          queryClient.invalidateQueries({ queryKey: ["pedidos", "admin"] });
          return;
        }
        if (msg.event === "NUEVO_PEDIDO") {
          const nuevo = msg.data as PedidoPublic;
          queryClient.setQueryData<PedidoPublic[]>(
            ["pedidos", "admin"],
            (prev = []) => {
              if (prev.some((p) => p.id === nuevo.id)) return prev;
              return [nuevo, ...prev];
            },
          );
        } else if (msg.data && (msg.data as PedidoPublic).id) {
          const updated = msg.data as PedidoPublic;
          queryClient.setQueryData<PedidoPublic[]>(
            ["pedidos", "admin"],
            (prev = []) => prev.map((p) => (p.id === updated.id ? updated : p)),
          );
        }
      },
      [queryClient],
    ),
  });

  const estadoCount = pedidos.reduce<Record<string, number>>((acc, p) => {
    acc[p.estado] = (acc[p.estado] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        Panel de Administración
      </h1>

      {isLoading ? (
        <p className="text-slate-400 text-sm">Cargando…</p>
      ) : isError ? (
        <p className="text-red-500 text-sm">Error al cargar pedidos.</p>
      ) : (
        <>
          {/* Contadores por estado */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-8">
            {ESTADOS.map((estado) => (
              <div
                key={estado}
                className="bg-white rounded-xl border border-slate-200 p-4 text-center"
              >
                <p className="text-2xl font-bold text-slate-800">
                  {estadoCount[estado] ?? 0}
                </p>
                <p className="text-xs text-slate-500 capitalize mt-1">
                  {estado}
                </p>
              </div>
            ))}
          </div>

          {/* Tabla completa */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-semibold text-slate-700">
                Todos los pedidos ({pedidos.length})
              </h2>
            </div>
            {pedidos.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-sm">
                Sin pedidos registrados
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">ID</th>
                    <th className="px-6 py-3 text-left">Descripción</th>
                    <th className="px-6 py-3 text-left">Total</th>
                    <th className="px-6 py-3 text-left">Estado</th>
                    <th className="px-6 py-3 text-left">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pedidos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-slate-400">#{p.id}</td>
                      <td className="px-6 py-3 text-slate-700 max-w-xs truncate">
                        {p.descripcion}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        ${p.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-3">
                        <EstadoBadge estado={p.estado} />
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {p.usuario_id ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};
