"""
Servicio de uploads — sube y elimina imágenes en Cloudinary.

Configuración signed (BACKEND): el api_secret nunca llega al frontend.
Degradación elegante: si Cloudinary no está configurado, devuelve 503 en vez
de crashear al arrancar la app.
"""
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.modules.uploads.schema import CloudinaryResponse

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"]
MAX_BYTES = 5 * 1024 * 1024  # 5 MB

_configured = False


def _ensure_cloudinary():
    """Inicializa el SDK la primera vez. Lanza 503 si faltan credenciales."""
    global _configured
    if not settings.cloudinary_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cloudinary no está configurado (faltan CLOUDINARY_* en el entorno)",
        )
    if not _configured:
        import cloudinary

        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )
        _configured = True


async def upload_imagen(file: UploadFile, folder: str = "productos") -> CloudinaryResponse:
    _ensure_cloudinary()

    # Validación de tipo MIME
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo no permitido: {file.content_type}. Usá JPEG, PNG o WEBP.",
        )

    # Validación de tamaño (máx 5 MB)
    contenido = await file.read()
    if len(contenido) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La imagen supera el tamaño máximo de 5 MB",
        )

    import cloudinary.uploader

    try:
        resultado = cloudinary.uploader.upload(
            contenido,
            folder=f"foodstore/{folder}",
            resource_type="image",
            allowed_formats=ALLOWED_FORMATS,
            overwrite=False,
            unique_filename=True,
        )
    except Exception as e:  # pragma: no cover - depende de red/credenciales
        raise HTTPException(status_code=502, detail=f"Error subiendo a Cloudinary: {e}")

    return CloudinaryResponse(
        secure_url=resultado.get("secure_url", ""),
        public_id=resultado.get("public_id", ""),
        width=resultado.get("width", 0),
        height=resultado.get("height", 0),
        format=resultado.get("format", ""),
        resource_type=resultado.get("resource_type", "image"),
    )


def eliminar_imagen(public_id: str) -> None:
    _ensure_cloudinary()
    import cloudinary.uploader

    try:
        cloudinary.uploader.destroy(public_id, resource_type="image")
    except Exception as e:  # pragma: no cover
        raise HTTPException(status_code=502, detail=f"Error eliminando de Cloudinary: {e}")
