import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as pedidosApi from "../../../api/pedidosApi";
import { useWebSocket, type WsMessage } from "../../../hooks/useWebSocket";
import { useAuthStore } from "../../../stores/useAuthStore";
import type { PedidoPublic } from "../../../types/api";
import { PedidoCardCliente } from "../components/PedidoCardCliente";

export const ClientePage = () => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [total, setTotal] = useState("");

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["pedidos", "cliente"],
    queryFn: pedidosApi.getMisPedidos,
    enabled: isAuthenticated,
  });

  const crearMutation = useMutation({
    mutationFn: pedidosApi.createPedido,
    onSuccess: (nuevo) => {
      queryClient.setQueryData<PedidoPublic[]>(
        ["pedidos", "cliente"],
        (prev = []) => [nuevo, ...prev],
      );
      subscribeToOrderRef.current?.(nuevo.id);
      setDesc("");
      setTotal("");
    },
    onError: (e) =>
      setError(e instanceof Error ? e.message : "Error al crear pedido"),
  });

  const { subscribeToOrder } = useWebSocket({
    enabled: isAuthenticated,
    onMessage: useCallback(
      (msg: WsMessage) => {
        if (msg.event === "WS_CONNECTED") {
          queryClient
            .invalidateQueries({ queryKey: ["pedidos", "cliente"] })
            .then(() => {
              const latest =
                queryClient.getQueryData<PedidoPublic[]>([
                  "pedidos",
                  "cliente",
                ]) ?? [];
              latest
                .filter((p) => !["entregado", "cancelado"].includes(p.estado))
                .forEach((p) => subscribeToOrderRef.current?.(p.id));
            });
          return;
        }
        const updateEvents = [
          "PEDIDO_CONFIRMADO",
          "PEDIDO_EN_PREPARACION",
          "PEDIDO_LISTO",
          "PEDIDO_CANCELADO",
          "PEDIDO_ENTREGADO",
        ];
        if (updateEvents.includes(msg.event)) {
          const updated = msg.data as PedidoPublic;
          queryClient.setQueryData<PedidoPublic[]>(
            ["pedidos", "cliente"],
            (prev = []) => prev.map((p) => (p.id === updated.id ? updated : p)),
          );
        }
      },
      [queryClient],
    ),
  });

  // Ref para usar subscribeToOrder dentro del onMessage sin ciclos
  const subscribeToOrderRef = useRef(subscribeToOrder);
  useEffect(() => {
    subscribeToOrderRef.current = subscribeToOrder;
  });

  // Suscribirse a pedidos activos al cargar la lista
  useEffect(() => {
    pedidos
      .filter((p) => !["entregado", "cancelado"].includes(p.estado))
      .forEach((p) => subscribeToOrder(p.id));
  }, [pedidos, subscribeToOrder]);

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    crearMutation.mutate({
      descripcion: desc,
      total: total ? parseFloat(total) : 0,
    });
  }

  const isCreating = crearMutation.isPending;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Mis Pedidos</h1>

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

      {/* Formulario de nuevo pedido */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-700 mb-4">Nuevo pedido</h2>
        <form
          onSubmit={handleCreate}
          className="flex gap-3 items-end flex-wrap"
        >
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-slate-500 mb-1">
              Descripción *
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required
              disabled={isCreating}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              placeholder="Ej: 2 pizzas margarita"
            />
          </div>
          <div className="w-32">
            <label className="block text-xs text-slate-500 mb-1">
              Total ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              disabled={isCreating}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              placeholder="0.00"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isCreating ? "Creando…" : "Pedir"}
          </button>
        </form>
      </div>

      {/* Lista de pedidos */}
      {isLoading ? (
        <p className="text-slate-400 text-sm">Cargando…</p>
      ) : pedidos.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">
          <p className="text-4xl mb-3">🛒</p>
          <p className="text-sm">Todavía no tenés pedidos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((p) => (
            <PedidoCardCliente key={p.id} pedido={p} />
          ))}
        </div>
      )}
    </div>
  );
};
