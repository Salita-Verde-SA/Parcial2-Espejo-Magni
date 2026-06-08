import type { PedidoPublic } from "../../../types/api";

export const ACCIONES: Record<
  string,
  { label: string; estado: string; colorClass: string }[]
> = {
  pendiente: [
    {
      label: "Confirmar",
      estado: "confirmado",
      colorClass: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    {
      label: "Cancelar",
      estado: "cancelado",
      colorClass:
        "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
    },
  ],
  confirmado: [
    {
      label: "A cocina",
      estado: "preparando",
      colorClass: "bg-orange-500 hover:bg-orange-600 text-white",
    },
    {
      label: "Cancelar",
      estado: "cancelado",
      colorClass:
        "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
    },
  ],
  // preparando: la cocina se encarga — sin acciones para el cajero
  listo: [
    {
      label: "Entregar ✅",
      estado: "entregado",
      colorClass: "bg-green-600 hover:bg-green-700 text-white",
    },
  ],
};

interface PedidoCardCajeroProps {
  pedido: PedidoPublic;
  isLoading: boolean;
  onAccion: (nuevoEstado: string) => void;
}

export const PedidoCardCajero = ({
  pedido,
  isLoading,
  onAccion,
}: PedidoCardCajeroProps) => {
  const acciones = ACCIONES[pedido.estado] ?? [];
  const isListo = pedido.estado === "listo";

  return (
    <div
      className={`bg-white rounded-xl border p-4 transition-all ${
        isListo
          ? "border-green-300 shadow-md shadow-green-100"
          : "border-slate-200 hover:shadow-sm"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold text-slate-400">
          #{pedido.id}
        </span>
        <span className="text-sm font-bold text-slate-700">
          ${pedido.total.toFixed(2)}
        </span>
      </div>

      <p className="text-sm text-slate-700 font-medium mb-4 leading-snug line-clamp-3">
        {pedido.descripcion}
      </p>

      {acciones.length > 0 ? (
        <div className="flex flex-col gap-2">
          {acciones.map((accion) => (
            <button
              key={accion.estado}
              disabled={isLoading}
              onClick={() => onAccion(accion.estado)}
              className={`w-full py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${accion.colorClass}`}
            >
              {isLoading ? "…" : accion.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 text-center italic">
          Esperando cocina…
        </p>
      )}
    </div>
  );
};
