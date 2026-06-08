const estadoBadgeClass: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  confirmado: "bg-blue-100 text-blue-700",
  preparando: "bg-orange-100 text-orange-700",
  listo: "bg-green-100 text-green-700",
  entregado: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-700",
};

interface EstadoBadgeProps {
  estado: string;
}

export const EstadoBadge = ({ estado }: EstadoBadgeProps) => (
  <span
    className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
      estadoBadgeClass[estado] ?? "bg-slate-100 text-slate-600"
    }`}
  >
    {estado}
  </span>
);
