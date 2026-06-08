import type { PedidoPublic } from "../../../types/api";
import { PedidoCardCajero } from "./PedidoCardCajero";

export interface Columna {
  estado: string;
  label: string;
  emoji: string;
  headerClass: string;
  countClass: string;
}

export const COLUMNAS: Columna[] = [
  {
    estado: "pendiente",
    label: "Pendiente",
    emoji: "🕐",
    headerClass: "bg-yellow-50 border-yellow-200",
    countClass: "bg-yellow-100 text-yellow-700",
  },
  {
    estado: "confirmado",
    label: "Confirmado",
    emoji: "✅",
    headerClass: "bg-blue-50 border-blue-200",
    countClass: "bg-blue-100 text-blue-700",
  },
  {
    estado: "preparando",
    label: "En cocina",
    emoji: "🍳",
    headerClass: "bg-orange-50 border-orange-200",
    countClass: "bg-orange-100 text-orange-700",
  },
  {
    estado: "listo",
    label: "Listo",
    emoji: "🔔",
    headerClass: "bg-green-50 border-green-300",
    countClass: "bg-green-100 text-green-700",
  },
];

interface KanbanColumnaProps {
  columna: Columna;
  pedidos: PedidoPublic[];
  loadingId: number | null;
  onAccion: (pedidoId: number, nuevoEstado: string) => void;
}

export const KanbanColumna = ({
  columna,
  pedidos,
  loadingId,
  onAccion,
}: KanbanColumnaProps) => (
  <div className="flex flex-col">
    {/* Header */}
    <div
      className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border-x border-t ${columna.headerClass}`}
    >
      <div className="flex items-center gap-2">
        <span>{columna.emoji}</span>
        <span className="text-sm font-semibold text-slate-700">
          {columna.label}
        </span>
      </div>
      <span
        className={`text-xs font-bold px-2 py-0.5 rounded-full ${columna.countClass}`}
      >
        {pedidos.length}
      </span>
    </div>

    {/* Cuerpo */}
    <div
      className={`flex-1 border-x border-b rounded-b-xl p-3 space-y-3 min-h-64 ${columna.headerClass}`}
    >
      {pedidos.length === 0 ? (
        <div className="flex items-center justify-center h-20 text-slate-400 text-xs italic">
          Sin pedidos
        </div>
      ) : (
        pedidos.map((p) => (
          <PedidoCardCajero
            key={p.id}
            pedido={p}
            isLoading={loadingId === p.id}
            onAccion={(nuevoEstado) => onAccion(p.id, nuevoEstado)}
          />
        ))
      )}
    </div>
  </div>
);
