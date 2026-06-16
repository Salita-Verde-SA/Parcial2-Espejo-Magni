"""
Observabilidad (v6) — middleware de logging + timing y exception handlers globales.

Qué resuelve, alineado con la checklist de la presentación:
  - Logs:     cada petición HTTP se imprime por consola (método, ruta, status, ms).
  - Timing:   se mide el tiempo de proceso y se expone en el header `X-Process-Time`.
  - Errores:  exception handler global que devuelve respuestas RFC 7807
              (Problem Details) y registra el error por consola con su traza.

Capa: core. No conoce capas superiores; se engancha en `app.main` sobre la app.
Implementación en memoria/stdout (suficiente para la demo y un solo proceso).
"""
import logging
import time
import uuid

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

# ── Logger dedicado ──────────────────────────────────────────────────────────
# Escribe a stdout con un formato compacto y legible en la consola del backend.
logger = logging.getLogger("foodstore")
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(
        logging.Formatter("%(asctime)s | %(levelname)-7s | %(message)s", datefmt="%H:%M:%S")
    )
    logger.addHandler(_handler)
    logger.setLevel(logging.INFO)
    logger.propagate = False


# ── RFC 7807: Problem Details ────────────────────────────────────────────────
def _problem(status_code: int, title: str, detail, request: Request, extra: dict | None = None) -> JSONResponse:
    body = {
        "type": "about:blank",
        "title": title,
        "status": status_code,
        "detail": detail,
        "instance": str(request.url.path),
    }
    if extra:
        body.update(extra)
    return JSONResponse(status_code=status_code, content=body, media_type="application/problem+json")


def register_observability(app: FastAPI) -> None:
    """Engancha el middleware de logging/timing y los exception handlers globales."""

    # ── Middleware: Logging + Timing ─────────────────────────────────────────
    @app.middleware("http")
    async def log_and_time_requests(request: Request, call_next):
        request_id = uuid.uuid4().hex[:8]
        start = time.perf_counter()
        client = request.client.host if request.client else "?"

        # Log de entrada: vemos la petición apenas llega.
        logger.info(f"→ [{request_id}] {request.method} {request.url.path} (from {client})")

        try:
            response = await call_next(request)
        except Exception:
            # Si algo explota dentro del stack, lo medimos igual y lo relanzamos
            # para que lo capture el exception handler global de abajo.
            elapsed_ms = (time.perf_counter() - start) * 1000
            logger.exception(f"✗ [{request_id}] {request.method} {request.url.path} falló en {elapsed_ms:.1f}ms")
            raise

        elapsed_ms = (time.perf_counter() - start) * 1000
        # Timing expuesto al cliente por header (verificable desde el navegador / Swagger).
        response.headers["X-Process-Time"] = f"{elapsed_ms:.1f}ms"
        response.headers["X-Request-ID"] = request_id

        flecha = "✓" if response.status_code < 400 else "⚠"
        logger.info(
            f"{flecha} [{request_id}] {request.method} {request.url.path} "
            f"→ {response.status_code} ({elapsed_ms:.1f}ms)"
        )
        return response

    # ── Exception Handlers globales ──────────────────────────────────────────
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        # 4xx esperados (404, 403, 422 de negocio, 429 de rate limit, etc.).
        logger.warning(f"HTTP {exc.status_code} en {request.url.path}: {exc.detail}")
        headers = getattr(exc, "headers", None) or {}
        return _problem(
            exc.status_code,
            title=str(exc.detail) if exc.status_code < 500 else "Error interno",
            detail=exc.detail,
            request=request,
            extra={k: v for k, v in {"retry_after": headers.get("Retry-After")}.items() if v},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        # 422 de validación de Pydantic: payload mal formado.
        logger.warning(f"Validación 422 en {request.url.path}: {exc.errors()}")
        return _problem(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            title="Error de validación",
            detail="Uno o más campos del payload son inválidos.",
            request=request,
            extra={"errors": exc.errors()},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        # Red de seguridad: cualquier error NO controlado termina acá como 500,
        # con la traza completa en consola pero SIN filtrar detalles internos al cliente.
        logger.exception(f"500 NO CONTROLADO en {request.url.path}: {exc}")
        return _problem(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            title="Error interno del servidor",
            detail="Ocurrió un error inesperado. El equipo fue notificado.",
            request=request,
        )

    logger.info("Observabilidad activada: logging + timing + exception handlers (RFC 7807)")
