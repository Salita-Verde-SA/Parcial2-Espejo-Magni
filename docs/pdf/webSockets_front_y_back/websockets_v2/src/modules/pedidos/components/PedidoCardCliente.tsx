import type { PedidoPublic } from "../../../types/api";
import { EstadoBadge } from "../../../components/ui/EstadoBadge";

const ESTADO_STEPS = [
  "pendiente",
  "confirmado",
  "preparando",
  "listo",
  "entregado",
];

interface PedidoCardClienteProps {
  pedido: PedidoPublic;
}

export const PedidoCardCliente = ({ pedido }: PedidoCardClienteProps) => {
  const isCanceled = pedido.estado === "cancelado";
  const currentStep = ESTADO_STEPS.indexOf(pedido.estado);

  return (
    <div
      className={`bg-white rounded-xl border p-5 transition-all ${
        isCanceled
          ? "border-red-200 opacity-60"
          : "border-slate-200 hover:shadow-sm"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium text-slate-800">{pedido.descripcion}</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Pedido #{pedido.id} · ${pedido.total.toFixed(2)}
          </p>
        </div>
        <EstadoBadge estado={pedido.estado} />
      </div>

      {!isCanceled && (
        <>
          {/* Barra de progreso */}
          <div className="flex items-center">
            {ESTADO_STEPS.map((step, i) => (
              <div
                key={step}
                className="flex items-center flex-1 last:flex-none"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                    i <= currentStep
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {i < currentStep ? "✓" : i + 1}
                </div>
                {i < ESTADO_STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 transition-colors ${
                      i < currentStep ? "bg-indigo-600" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {ESTADO_STEPS.map((step) => (
              <span
                key={step}
                className="text-xs text-slate-400 capitalize text-center flex-1"
              >
                {step}
              </span>
            ))}
          </div>
        </>
      )}

      {isCanceled && (
        <p className="text-xs text-red-500 text-center mt-2">
          Este pedido fue cancelado
        </p>
      )}
    </div>
  );
};
