import type { PedidoPublic } from "../../../types/api";

interface KdsCardProps {
  pedido: PedidoPublic;
  actionLabel: string;
  actionEstado: string;
  actionColorClass: string;
  isLoading: boolean;
  onAction: () => void;
}

export const KdsCard = ({
  pedido,
  actionLabel,
  actionColorClass,
  isLoading,
  onAction,
}: KdsCardProps) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-3">
      <div>
        <span className="text-xs text-slate-400 font-medium">
          Pedido #{pedido.id}
        </span>
        <h3 className="font-semibold text-slate-800 mt-0.5 text-base">
          {pedido.descripcion}
        </h3>
      </div>
      <span className="text-sm font-semibold text-slate-600 shrink-0 ml-2">
        ${pedido.total.toFixed(2)}
      </span>
    </div>
    <button
      disabled={isLoading}
      onClick={onAction}
      className={`w-full py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${actionColorClass}`}
    >
      {isLoading ? "Procesando…" : actionLabel}
    </button>
  </div>
);
