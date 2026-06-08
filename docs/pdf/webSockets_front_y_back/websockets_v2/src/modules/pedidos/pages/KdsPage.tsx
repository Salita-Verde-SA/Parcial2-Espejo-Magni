import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as pedidosApi from "../../../api/pedidosApi";
import { useWebSocket, type WsMessage } from "../../../hooks/useWebSocket";
import { useAuthStore } from "../../../stores/useAuthStore";
import type { PedidoPublic } from "../../../types/api";
import { KdsCard } from "../components/KdsCard";

export const KdsPage = () => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["pedidos", "cocina"],
    queryFn: pedidosApi.getCocinaPedidos,
    enabled: isAuthenticated,
  });

  const avanzarMutation = useMutation({
    mutationFn: ({
      pedidoId,
      nuevoEstado,
    }: {
      pedidoId: number;
      nuevoEstado: string;
    }) => pedidosApi.avanzarEstado(pedidoId, nuevoEstado),
    onMutate: ({ pedidoId }) => setLoadingId(pedidoId),
    onSuccess: (updated) => {
      if (updated.estado === "listo" || updated.estado === "cancelado") {
        queryClient.setQueryData<PedidoPublic[]>(
          ["pedidos", "cocina"],
          (prev = []) => prev.filter((p) => p.id !== updated.id),
        );
      } else {
        queryClient.setQueryData<PedidoPublic[]>(
          ["pedidos", "cocina"],
          (prev = []) => prev.map((p) => (p.id === updated.id ? updated : p)),
        );
      }
    },
    onError: (e) =>
      setError(e instanceof Error ? e.message : "Error al avanzar estado"),
    onSettled: () => setLoadingId(null),
  });

  useWebSocket({
    enabled: isAuthenticated,
    onMessage: useCallback(
      (msg: WsMessage) => {
        console.log("[KDS WS]", msg.event, msg.data);
        if (msg.event === "WS_CONNECTED") {
          queryClient.invalidateQueries({ queryKey: ["pedidos", "cocina"] });
          return;
        }
        if (msg.event === "PEDIDO_EN_PREPARACION") {
          const updated = msg.data as PedidoPublic;
          queryClient.setQueryData<PedidoPublic[]>(
            ["pedidos", "cocina"],
            (prev = []) => {
              const exists = prev.some((p) => p.id === updated.id);
              return exists
                ? prev.map((p) => (p.id === updated.id ? updated : p))
                : [...prev, updated];
            },
          );
        } else if (
          msg.event === "PEDIDO_LISTO" ||
          msg.event === "PEDIDO_CANCELADO"
        ) {
          const updated = msg.data as PedidoPublic;
          queryClient.setQueryData<PedidoPublic[]>(
            ["pedidos", "cocina"],
            (prev = []) => prev.filter((p) => p.id !== updated.id),
          );
        }
      },
      [queryClient],
    ),
  });

  function handleAvanzar(pedidoId: number, nuevoEstado: string) {
    avanzarMutation.mutate({ pedidoId, nuevoEstado });
  }

  const preparando = pedidos.filter((p) => p.estado === "preparando");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          🍳 KDS — Display de Cocina
        </h1>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            En vivo
          </span>
          <button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["pedidos", "cocina"] })
            }
            className="text-sm text-indigo-600 hover:underline cursor-pointer"
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex justify-between">
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
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
              En Preparación
            </h2>
            <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {preparando.length}
            </span>
          </div>
          <div className="space-y-3">
            {preparando.length === 0 ? (
              <div className="text-slate-400 text-sm text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <p className="text-2xl mb-2">🍳</p>
                <p>Esperando pedidos de la caja…</p>
              </div>
            ) : (
              preparando.map((p) => (
                <KdsCard
                  key={p.id}
                  pedido={p}
                  actionLabel="Listo ✅"
                  actionEstado="listo"
                  actionColorClass="bg-green-600 hover:bg-green-700 text-white"
                  isLoading={loadingId === p.id}
                  onAction={() => handleAvanzar(p.id, "listo")}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
