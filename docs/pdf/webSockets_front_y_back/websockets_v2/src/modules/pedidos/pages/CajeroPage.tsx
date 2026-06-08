import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as pedidosApi from "../../../api/pedidosApi";
import { useWebSocket, type WsMessage } from "../../../hooks/useWebSocket";
import { useAuthStore } from "../../../stores/useAuthStore";
import type { PedidoPublic } from "../../../types/api";
import { KanbanColumna, COLUMNAS } from "../components/KanbanColumna";

export const CajeroPage = () => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["pedidos", "cajero"],
    queryFn: pedidosApi.getCajeroPedidos,
    enabled: isAuthenticated,
  });

  const accionMutation = useMutation({
    mutationFn: ({
      pedidoId,
      nuevoEstado,
    }: {
      pedidoId: number;
      nuevoEstado: string;
    }) => pedidosApi.avanzarEstado(pedidoId, nuevoEstado),
    onMutate: ({ pedidoId }) => setLoadingId(pedidoId),
    onSuccess: (updated) => {
      queryClient.setQueryData<PedidoPublic[]>(
        ["pedidos", "cajero"],
        (prev = []) => prev.map((p) => (p.id === updated.id ? updated : p)),
      );
    },
    onError: (e) =>
      setError(e instanceof Error ? e.message : "Error al cambiar estado"),
    onSettled: () => setLoadingId(null),
  });

  useWebSocket({
    enabled: isAuthenticated,
    onMessage: useCallback(
      (msg: WsMessage) => {
        console.log("[CAJERO WS]", msg.event, msg.data);
        if (msg.event === "WS_CONNECTED") {
          queryClient.invalidateQueries({ queryKey: ["pedidos", "cajero"] });
          return;
        }
        if (msg.event === "NUEVO_PEDIDO") {
          const nuevo = msg.data as PedidoPublic;
          queryClient.setQueryData<PedidoPublic[]>(
            ["pedidos", "cajero"],
            (prev = []) => {
              if (prev.some((p) => p.id === nuevo.id)) return prev;
              return [nuevo, ...prev];
            },
          );
        } else {
          const updated = msg.data as PedidoPublic;
          if (updated?.id) {
            queryClient.setQueryData<PedidoPublic[]>(
              ["pedidos", "cajero"],
              (prev = []) =>
                prev.map((p) => (p.id === updated.id ? updated : p)),
            );
          }
        }
      },
      [queryClient],
    ),
  });

  function handleAccion(pedidoId: number, nuevoEstado: string) {
    accionMutation.mutate({ pedidoId, nuevoEstado });
  }

  const porEstado = COLUMNAS.reduce<Record<string, PedidoPublic[]>>(
    (acc, col) => {
      acc[col.estado] = pedidos.filter((p) => p.estado === col.estado);
      return acc;
    },
    {},
  );

  const cerrados = pedidos.filter((p) =>
    ["entregado", "cancelado"].includes(p.estado),
  );

  const listos = porEstado["listo"] ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Cajero</h1>
        <button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["pedidos", "cajero"] })
          }
          className="text-sm text-indigo-600 hover:underline cursor-pointer"
        >
          ↻ Actualizar
        </button>
      </div>

      {listos.length > 0 && (
        <div className="mb-5 p-3 bg-green-50 border border-green-300 rounded-xl text-green-800 text-sm font-semibold flex items-center gap-2 animate-pulse">
          <span>🔔</span>
          {listos.length === 1
            ? "1 pedido listo para entregar"
            : `${listos.length} pedidos listos para entregar`}
        </div>
      )}

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-slate-400 text-sm">Cargando…</p>
      ) : (
        <>
          {/* Board Kanban — 2 cols en mobile, 4 en desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {COLUMNAS.map((col) => (
              <KanbanColumna
                key={col.estado}
                columna={col}
                pedidos={porEstado[col.estado] ?? []}
                loadingId={loadingId}
                onAccion={handleAccion}
              />
            ))}
          </div>

          {/* Historial colapsable */}
          {cerrados.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer select-none list-none flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                <span className="transition-transform group-open:rotate-90 inline-block">
                  ▶
                </span>
                Historial ({cerrados.length})
              </summary>
              <div className="mt-3 bg-white rounded-xl border border-slate-200 overflow-hidden opacity-70">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="px-5 py-3 text-left">ID</th>
                      <th className="px-5 py-3 text-left">Descripción</th>
                      <th className="px-5 py-3 text-left">Total</th>
                      <th className="px-5 py-3 text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cerrados.map((p) => (
                      <tr key={p.id}>
                        <td className="px-5 py-3 text-slate-400">#{p.id}</td>
                        <td className="px-5 py-3 text-slate-500">
                          {p.descripcion}
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          ${p.total.toFixed(2)}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                              p.estado === "entregado"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {p.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
};
