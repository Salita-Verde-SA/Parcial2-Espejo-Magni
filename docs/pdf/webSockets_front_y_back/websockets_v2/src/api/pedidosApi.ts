import { apiClient } from "../lib/axios";
import type { PedidoPublic, PedidoCreate } from "../types/api";

export async function getPedidos(): Promise<PedidoPublic[]> {
  const { data } = await apiClient.get<PedidoPublic[]>("/pedidos");
  return data;
}

export async function getMisPedidos(): Promise<PedidoPublic[]> {
  const { data } = await apiClient.get<PedidoPublic[]>("/cliente/mis-pedidos");
  return data;
}

export async function getCajeroPedidos(): Promise<PedidoPublic[]> {
  const { data } = await apiClient.get<PedidoPublic[]>("/cajero/pedidos");
  return data;
}

export async function getCocinaPedidos(): Promise<PedidoPublic[]> {
  const { data } = await apiClient.get<PedidoPublic[]>("/cocina/pedidos");
  return data;
}

export async function createPedido(
  payload: PedidoCreate,
): Promise<PedidoPublic> {
  const { data } = await apiClient.post<PedidoPublic>("/pedidos", payload);
  return data;
}

export async function avanzarEstado(
  pedidoId: number,
  nuevo_estado: string,
  motivo?: string,
): Promise<PedidoPublic> {
  const { data } = await apiClient.patch<PedidoPublic>(
    `/pedidos/${pedidoId}/estado`,
    { nuevo_estado, motivo },
  );
  return data;
}
