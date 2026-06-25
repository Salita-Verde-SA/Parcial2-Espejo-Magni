"""
Rate limiting en memoria para endpoints de autenticación.

Política (v6): máximo 5 intentos FALLIDOS por dirección IP en una ventana de
15 minutos. Al superarlo se responde HTTP 429 con header Retry-After.

Implementación simple en memoria (suficiente para un solo proceso / demo).
Para producción multi-worker se reemplazaría por Redis.
"""
from collections import defaultdict, deque
from time import monotonic

from fastapi import HTTPException, Request, status

MAX_ATTEMPTS = 5
WINDOW_SECONDS = 15 * 60  # 15 minutos


class RateLimiter:
    def __init__(self, max_attempts: int = MAX_ATTEMPTS, window_seconds: int = WINDOW_SECONDS):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        # ip -> deque[timestamp] de intentos fallidos dentro de la ventana
        self._failures: dict[str, deque[float]] = defaultdict(deque)

    def _prune(self, ip: str, now: float) -> None:
        bucket = self._failures[ip]
        limite = now - self.window_seconds
        while bucket and bucket[0] < limite:
            bucket.popleft()

    def check(self, ip: str) -> None:
        """Lanza 429 si la IP ya superó el límite de intentos fallidos."""
        now = monotonic()
        self._prune(ip, now)
        bucket = self._failures[ip]
        if len(bucket) >= self.max_attempts:
            retry_after = int(self.window_seconds - (now - bucket[0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiados intentos fallidos. Intentá nuevamente más tarde.",
                headers={"Retry-After": str(max(retry_after, 1))},
            )

    def register_failure(self, ip: str) -> None:
        now = monotonic()
        self._prune(ip, now)
        self._failures[ip].append(now)

    def reset(self, ip: str | None = None) -> None:
        if ip is None:
            self._failures.clear()
        else:
            self._failures.pop(ip, None)


# Singleton compartido por los endpoints de auth.
auth_limiter = RateLimiter()


def client_ip(request: Request) -> str:
    """Resuelve la IP del cliente respetando X-Forwarded-For (detrás de nginx)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
