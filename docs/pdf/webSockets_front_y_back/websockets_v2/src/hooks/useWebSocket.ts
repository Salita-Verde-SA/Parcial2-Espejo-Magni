import { useEffect, useRef, useCallback } from "react";

const WS_URL = "ws://localhost:8000/api/v1/cocina/ws";

export interface WsMessage {
  event: string;
  data: unknown;
}

interface UseWebSocketOptions {
  onMessage?: (msg: WsMessage) => void;
  enabled?: boolean;
}

/**
 * Hook que gestiona una conexión WebSocket persistente con el backend.
 *
 * AUTENTICACIÓN
 * El backend autentica el socket leyendo la cookie httpOnly que el navegador
 * envía automáticamente durante el handshake HTTP → WS. No se necesita
 * pasar ningún header o token manualmente.
 * Si la cookie no es válida el servidor cierra con código 1008 (Policy Violation)
 * y el hook NO reintenta para no hacer bucles de reconexión sin sentido.
 *
 * ROOMS / SUSCRIPCIONES
 * Al conectarse el backend automáticamente une el socket a la sala "role:{rol}",
 * de modo que los eventos dirigidos a ese rol llegan sin acción extra del cliente.
 * Adicionalmente, el cliente puede suscribirse a un pedido concreto llamando a
 * subscribeToOrder(id), lo que hace que el backend también lo una a "order:{id}".
 * Esto permite recibir actualizaciones granulares por pedido además de las
 * notificaciones globales por rol.
 *
 * RECONEXIÓN CON BACKOFF EXPONENCIAL
 * Si la conexión se cierra de forma anormal (cualquier código que no sea 1000 ni 1008)
 * el hook programa un reintento con backoff exponencial:
 *   intento 1 → 2 s, intento 2 → 4 s, intento 3 → 8 s … máximo 30 s.
 * Al reconectarse exitosamente el contador se reinicia.
 *
 * EVENTO SINTÉTICO WS_CONNECTED
 * El backend no emite ningún mensaje al conectarse. Para que las páginas puedan
 * reaccionar a la (re)conexión —por ejemplo recargando datos y re-suscribiéndose
 * a pedidos activos— el hook emite un mensaje local ficticio con event "WS_CONNECTED"
 * en el handler onopen, antes de que llegue cualquier mensaje real del servidor.
 *
 * COMPATIBILIDAD CON REACT STRICTMODE
 * En desarrollo React monta, desmonta y vuelve a montar cada componente para
 * detectar efectos con side-effects. El flag `cancelled` y la función closeCleanly
 * garantizan que si el efecto se limpia mientras el socket todavía está en estado
 * CONNECTING (no se puede cerrar aún) la conexión se cierra en cuanto abre,
 * sin lanzar errores ni dejar sockets huérfanos.
 */
export function useWebSocket({
  onMessage,
  enabled = true,
}: UseWebSocketOptions = {}) {
  // Referencia al socket activo para poder enviar mensajes desde fuera del efecto
  // (subscribeToOrder / unsubscribeFromOrder). Se usa ref en lugar de state para
  // no provocar re-renders al cambiar el socket.
  const wsRef = useRef<WebSocket | null>(null);

  // Ref al callback onMessage para evitar que el efecto se ejecute cada vez que
  // el padre re-renderiza con una nueva función anónima. El efecto solo depende
  // de `enabled`; el handler siempre apunta a la versión más reciente gracias a
  // este patrón de "ref sincronizada".
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) return;

    // Flag que se activa cuando el componente se desmonta o `enabled` cambia a false.
    // Todos los callbacks asíncronos (onopen, onclose, setTimeout) lo comprueban
    // antes de actuar para no ejecutar lógica sobre un componente ya desmontado.
    let cancelled = false;

    // Número de intentos de reconexión fallidos consecutivos, usado para calcular
    // el delay exponencial. Se resetea a 0 al conectar exitosamente.
    let retryCount = 0;

    // Timer de reconexión pendiente. Se guarda para poder cancelarlo en el cleanup
    // si el componente se desmonta antes de que dispare.
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    // Referencia local al socket del intento actual, separada de wsRef para poder
    // comparar en onclose si el evento pertenece al socket vigente o a uno ya
    // reemplazado por un reintento posterior.
    let currentWs: WebSocket | null = null;

    /**
     * Cierra el socket de forma segura teniendo en cuenta su estado actual.
     * No se puede llamar a ws.close() mientras el socket está en CONNECTING porque
     * algunos navegadores ignoran la llamada o lanzar errores.
     */
    const closeCleanly = (ws: WebSocket) => {
      if (ws.readyState === WebSocket.CONNECTING) {
        // Esperamos a que el socket abra y lo cerramos inmediatamente con código 1000
        // (cierre limpio/intencional). El handler onopen principal ve `cancelled = true`
        // y no emite WS_CONNECTED, por lo que el componente no procesa mensajes.
        ws.addEventListener("open", () => ws.close(1000), { once: true });
      } else if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000);
      }
      // CLOSING / CLOSED: el navegador ya gestiona el cierre, no hay nada que hacer.
    };

    const connect = () => {
      if (cancelled) return;

      const ws = new WebSocket(WS_URL);
      currentWs = ws;
      // Exponemos el socket en wsRef para que subscribeToOrder pueda usarlo
      // en cuanto el socket esté OPEN.
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) {
          // El componente se desmontó mientras el socket conectaba (StrictMode).
          // Cerramos sin emitir WS_CONNECTED para no ejecutar lógica stale.
          ws.close(1000);
          return;
        }
        // Reconexión exitosa: resetear backoff para que el próximo intento
        // (si ocurre) empiece de nuevo desde el delay mínimo.
        retryCount = 0;
        // Emitir evento sintético para que las páginas sepan que el canal está listo
        // y puedan recargar datos o re-suscribirse a pedidos activos que estaban
        // siguiendo antes de la desconexión.
        onMessageRef.current?.({ event: "WS_CONNECTED", data: null });
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(event.data as string) as WsMessage;
          onMessageRef.current?.(msg);
        } catch {
          // Ignorar mensajes malformados; no deberían ocurrir en producción normal.
        }
      };

      ws.onerror = () => {
        // Los errores de WebSocket siempre van seguidos de un evento onclose.
        // Toda la lógica de reconexión se centraliza allí para no duplicar código.
      };

      ws.onclose = (e) => {
        // Si este onclose pertenece a un socket ya reemplazado (por un reintento
        // previo que llegó tarde), lo ignoramos para no interferir con el nuevo.
        if (wsRef.current === ws) wsRef.current = null;
        currentWs = null;

        const wasNormal = e.code === 1000; // cierre limpio / intencional
        const wasAuthRejected = e.code === 1008; // cookie inválida o expirada

        // No reintentar si: el componente se desmontó, fue un cierre limpio,
        // o el backend rechazó la autenticación (reintentar no sirve de nada).
        if (cancelled || wasNormal || wasAuthRejected) return;

        // Calcular el delay del próximo intento con backoff exponencial y un techo de 30 s.
        // Fórmula: 1000 * 2^retryCount → 2 s, 4 s, 8 s, 16 s, 30 s (cap), 30 s, …
        retryCount++;
        const delay = Math.min(1000 * 2 ** retryCount, 30_000);
        console.warn(
          `[WS] Reconectando en ${delay / 1000}s (intento ${retryCount})`,
        );
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();

    // Cleanup: se ejecuta al desmontar el componente o cuando `enabled` cambia.
    // Cancela cualquier reintento pendiente y cierra el socket activo si lo hay.
    return () => {
      cancelled = true;
      if (retryTimer !== null) clearTimeout(retryTimer);
      if (currentWs) closeCleanly(currentWs);
      wsRef.current = null;
    };
  }, [enabled]);

  /**
   * Envía un mensaje al backend para suscribirse a la sala "order:{orderId}".
   * A partir de ese momento el backend enrutará los eventos de ese pedido
   * específicamente a este socket, además de los eventos globales por rol.
   * Si el socket no está abierto la llamada es silenciosa (no lanza error).
   */
  const subscribeToOrder = useCallback((orderId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ action: "subscribe-order", order_id: orderId }),
      );
    }
  }, []);

  /**
   * Envía un mensaje al backend para desuscribirse de "order:{orderId}".
   * Útil cuando un pedido llega a un estado terminal (entregado / cancelado)
   * y ya no necesita actualizaciones en tiempo real.
   */
  const unsubscribeFromOrder = useCallback((orderId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ action: "unsubscribe-order", order_id: orderId }),
      );
    }
  }, []);

  return { subscribeToOrder, unsubscribeFromOrder };
}
